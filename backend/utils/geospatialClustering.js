import logger from './logger.js';
import natural from 'natural';

const { TfIdf, JaroWinklerDistance } = natural;

/**
 * Calculate Haversine distance between two coordinates
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Extract keywords from complaint using TF-IDF
 * @param {Array} complaints - Array of complaints to analyze
 * @returns {Object} Map of complaint index to keywords
 */
function extractKeywords(complaints) {
    const tfidf = new TfIdf();
    
    // Add all documents to TF-IDF
    complaints.forEach(complaint => {
        const text = `${complaint.title} ${complaint.description}`.toLowerCase();
        tfidf.addDocument(text);
    });
    
    // Extract top keywords for each complaint
    const keywordMap = {};
    complaints.forEach((complaint, index) => {
        const keywords = [];
        tfidf.listTerms(index).slice(0, 5).forEach(item => {
            if (item.term.length > 3) { // Only meaningful words
                keywords.push(item.term);
            }
        });
        keywordMap[index] = keywords;
    });
    
    return keywordMap;
}

/**
 * Calculate text similarity between two complaints
 * @param {string} text1 - First complaint text
 * @param {string} text2 - Second complaint text
 * @returns {number} Similarity score (0-1)
 */
function calculateTextSimilarity(text1, text2) {
    const distance = JaroWinklerDistance(text1.toLowerCase(), text2.toLowerCase());
    return distance;
}

/**
 * Generate meaningful hotspot name from cluster complaints
 * @param {Array} clusterComplaints - Complaints in the cluster
 * @returns {Object} Generated name and description
 */
function generateHotspotName(clusterComplaints) {
    if (clusterComplaints.length === 0) {
        return { name: 'Empty Cluster', description: 'No complaints in this area' };
    }
    
    // Extract all keywords using TF-IDF
    const tfidf = new TfIdf();
    clusterComplaints.forEach(c => {
        const text = `${c.title} ${c.description}`.toLowerCase();
        tfidf.addDocument(text);
    });
    
    // Get dominant keywords across all complaints
    const keywordFrequency = {};
    clusterComplaints.forEach((complaint, index) => {
        tfidf.listTerms(index).slice(0, 10).forEach(item => {
            if (item.term.length > 3) {
                keywordFrequency[item.term] = (keywordFrequency[item.term] || 0) + item.tfidf;
            }
        });
    });
    
    // Sort keywords by frequency
    const topKeywords = Object.entries(keywordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([term]) => term);
    
    // Get category distribution
    const categories = {};
    clusterComplaints.forEach(c => {
        categories[c.category] = (categories[c.category] || 0) + 1;
    });
    const dominantCategory = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])[0][0];
    
    // Get location (use address from first complaint)
    const firstComplaint = clusterComplaints[0];
    const addressParts = firstComplaint.location?.address?.split(',') || ['Unknown Area'];
    const areaName = addressParts[0]?.trim() || 'Unknown Area';
    
    // Generate name based on patterns
    let name = '';
    let description = '';
    
    // Pattern detection for common issues
    const hasOutage = topKeywords.some(k => ['outage', 'power', 'electricity', 'blackout'].includes(k));
    const hasWater = topKeywords.some(k => ['water', 'supply', 'leak', 'pipe'].includes(k));
    const hasRoad = topKeywords.some(k => ['road', 'pothole', 'street', 'damage'].includes(k));
    const hasGarbage = topKeywords.some(k => ['garbage', 'waste', 'trash', 'dump'].includes(k));
    
    if (hasOutage) {
        name = `Power Issues in ${areaName}`;
        description = `Multiple reports of electricity outages and power failures`;
    } else if (hasWater) {
        name = `Water Supply Problems in ${areaName}`;
        description = `Reports of water-related issues including leaks and supply disruptions`;
    } else if (hasRoad) {
        name = `Road Infrastructure Issues in ${areaName}`;
        description = `Multiple complaints about road conditions and maintenance`;
    } else if (hasGarbage) {
        name = `Waste Management Issues in ${areaName}`;
        description = `Reports of garbage collection and disposal problems`;
    } else {
        // Generic name using dominant category and keywords
        const categoryLabel = dominantCategory.charAt(0).toUpperCase() + dominantCategory.slice(1);
        const keywordPhrase = topKeywords.slice(0, 2).join(' and ');
        name = `${categoryLabel} Issues in ${areaName}`;
        description = `Multiple reports regarding ${keywordPhrase}`;
    }
    
    return {
        name,
        description,
        keywords: topKeywords,
        dominantCategory
    };
}

/**
 * DBSCAN clustering algorithm for geospatial hotspot detection
 * @param {Array} complaints - Array of complaints with coordinates
 * @param {number} epsilon - Maximum distance (km) for points to be neighbors
 * @param {number} minPoints - Minimum points to form a cluster
 * @returns {Array} Clusters with complaint data
 */
export function dbscanClustering(complaints, epsilon = 0.5, minPoints = 5) {
    const visited = new Set();
    const clustered = new Set();
    const clusters = [];
    const noise = [];

    function getNeighbors(pointIndex) {
        const neighbors = [];
        const point = complaints[pointIndex];
        
        for (let i = 0; i < complaints.length; i++) {
            if (i === pointIndex) continue;
            
            const other = complaints[i];
            const distance = haversineDistance(
                point.location.coordinates[1],
                point.location.coordinates[0],
                other.location.coordinates[1],
                other.location.coordinates[0]
            );
            
            if (distance <= epsilon) {
                neighbors.push(i);
            }
        }
        
        return neighbors;
    }

    function expandCluster(pointIndex, neighbors, cluster) {
        cluster.push(pointIndex);
        clustered.add(pointIndex);

        for (let i = 0; i < neighbors.length; i++) {
            const neighborIndex = neighbors[i];
            
            if (!visited.has(neighborIndex)) {
                visited.add(neighborIndex);
                const neighborNeighbors = getNeighbors(neighborIndex);
                
                if (neighborNeighbors.length >= minPoints) {
                    neighbors = neighbors.concat(neighborNeighbors);
                }
            }
            
            if (!clustered.has(neighborIndex)) {
                cluster.push(neighborIndex);
                clustered.add(neighborIndex);
            }
        }
    }

    // Main DBSCAN algorithm
    for (let i = 0; i < complaints.length; i++) {
        if (visited.has(i)) continue;
        
        visited.add(i);
        const neighbors = getNeighbors(i);
        
        if (neighbors.length < minPoints) {
            noise.push(i);
        } else {
            const cluster = [];
            expandCluster(i, neighbors, cluster);
            clusters.push(cluster);
        }
    }

    // Convert clusters to meaningful objects with hotspot names
    return clusters.map ((clusterIndices, clusterIndex) => {
        const clusterComplaints = clusterIndices.map(idx => complaints[idx]);
        
        // Calculate cluster center (centroid)
        const avgLat = clusterComplaints.reduce((sum, c) => sum + c.location.coordinates[1], 0) / clusterComplaints.length;
        const avgLon = clusterComplaints.reduce((sum, c) => sum + c.location.coordinates[0], 0) / clusterComplaints.length;
        
        // Calculate cluster statistics
        const priorityCounts = { high: 0, medium: 0, low: 0 };
        clusterComplaints.forEach(c => {
            priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
        });

        const categories = {};
        clusterComplaints.forEach(c => {
            categories[c.category] = (categories[c.category] || 0) + 1;
        });

        const dominantPriority = Object.entries(priorityCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        const dominantCategory = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])[0][0];

        // Generate hotspot name and description
        const hotspotInfo = generateHotspotName(clusterComplaints);
        
        // Calculate time range
        const timestamps = clusterComplaints
            .map(c => c.createdAt ? new Date(c.createdAt) : null)
            .filter(d => d !== null);
        
        const timeRange = timestamps.length > 0 ? {
            earliest: new Date(Math.min(...timestamps)),
            latest: new Date(Math.max(...timestamps))
        } : null;

        return {
            clusterId: clusterIndex + 1,
            name: hotspotInfo.name,
            description: hotspotInfo.description,
            keywords: hotspotInfo.keywords,
            center: [avgLon, avgLat],
            size: clusterComplaints.length,
            radius: epsilon,
            complaints: clusterComplaints, // Full complaint objects
            priorityDistribution: priorityCounts,
            categoryDistribution: categories,
            dominantPriority,
            dominantCategory,
            severity: dominantPriority === 'high' ? 1.0 :
                     dominantPriority === 'medium' ? 0.6 : 0.3,
            timeRange
        };
    });
}

/**
 * Generate heatmap data using Kernel Density Estimation
 * @param {Array} complaints - Complaints with coordinates
 * @param {number} bandwidth - Bandwidth for KDE (km)
 * @returns {Array} Heatmap points with intensity
 */
export function generateHeatmap(complaints, bandwidth = 1.0) {
    if (complaints.length === 0) return [];

    // Create grid points
    const lats = complaints.map(c => c.location.coordinates[1]);
    const lons = complaints.map(c => c.location.coordinates[0]);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const gridSize = 20; // 20x20 grid
    const latStep = (maxLat - minLat) / gridSize;
    const lonStep = (maxLon - minLon) / gridSize;

    const heatmapPoints = [];

    for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
            const lat = minLat + i * latStep;
            const lon = minLon + j * lonStep;
            
            // Calculate density using Gaussian kernel
            let intensity = 0;
            complaints.forEach(complaint => {
                const distance = haversineDistance(
                    lat, lon,
                    complaint.location.coordinates[1],
                    complaint.location.coordinates[0]
                );
                
                // Gaussian kernel
                const weight = Math.exp(-(distance * distance) / (2 * bandwidth * bandwidth));
                
                // Weight by priority
                const priorityMultiplier = complaint.priority === 'high' ? 3 :
                                         complaint.priority === 'medium' ? 2 : 1;
                
                intensity += weight * priorityMultiplier;
            });

            if (intensity > 0.1) { // Only include significant points
                heatmapPoints.push({
                    coordinates: [lon, lat],
                    intensity: Math.min(intensity, 10) / 10 // Normalize to 0-1
                });
            }
        }
    }

    return heatmapPoints;
}

export default { dbscanClustering, generateHeatmap };
