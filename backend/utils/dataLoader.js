import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load CSV dataset from file
 * @param {string} filename - Name of CSV file in data/datasets/
 * @returns {Promise<Array>} Array of complaint objects
 */
export async function loadDataset(filename) {
    const filePath = path.join(__dirname, '../data/datasets', filename);
    const results = [];

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            reject(new Error(`Dataset file not found: ${filePath}`));
            return;
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                console.log(`Loaded ${results.length} records from ${filename}`);
                resolve(results);
            })
            .on('error', (error) => reject(error));
    });
}

/**
 * Preprocess complaint data for ML training
 * @param {Array} data - Raw complaint data
 * @returns {Object} Processed features and labels
 */
export function preprocessData(data) {
    const features = [];
    const labels = [];

    data.forEach(complaint => {
        if (!complaint.description || !complaint.priority) return;

        // Extract text features
        const text = `${complaint.title || ''} ${complaint.description}`.toLowerCase();
        
        // Simple feature extraction (will be enhanced with TF-IDF)
        features.push({
            text: text,
            category: complaint.category,
            wordCount: text.split(' ').length,
            hasUrgent: text.includes('urgent') || text.includes('emergency') ? 1 : 0,
            hasMultiple: text.includes('multiple') || text.includes('many') ? 1 : 0,
        });

        // Label encoding: low=0, medium=1, high=2
        const priorityMap = { 'low': 0, 'medium': 1, 'high': 2 };
        labels.push(priorityMap[complaint.priority.toLowerCase()] || 1);
    });

    return { features, labels };
}

/**
 * Split data into training and testing sets
 * @param {Array} data - Complete dataset
 * @param {number} trainRatio - Ratio for training (default 0.8)
 * @returns {Object} Train and test splits
 */
export function trainTestSplit(data, trainRatio = 0.8) {
    // Shuffle data
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    
    const trainSize = Math.floor(shuffled.length * trainRatio);
    const trainData = shuffled.slice(0, trainSize);
    const testData = shuffled.slice(trainSize);

    return {
        train: trainData,
        test: testData,
        trainSize: trainData.length,
        testSize: testData.length
    };
}

/**
 * Get dataset statistics
 * @param {Array} data - Complaint dataset
 * @returns {Object} Statistics
 */
export function getDatasetStats(data) {
    const stats = {
        total: data.length,
        byCategory: {},
        byPriority: {},
        byStatus: {},
        avgResolutionTime: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    data.forEach(complaint => {
        // Category distribution
        stats.byCategory[complaint.category] = (stats.byCategory[complaint.category] || 0) + 1;
        
        // Priority distribution
        stats.byPriority[complaint.priority] = (stats.byPriority[complaint.priority] || 0) + 1;
        
        // Status distribution
        stats.byStatus[complaint.status] = (stats.byStatus[complaint.status] || 0) + 1;

        // Resolution time
        if (complaint.resolution_time_hours) {
            totalResolutionTime += parseFloat(complaint.resolution_time_hours);
            resolvedCount++;
        }
    });

    stats.avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

    return stats;
}

export default { loadDataset, preprocessData, trainTestSplit, getDatasetStats };
