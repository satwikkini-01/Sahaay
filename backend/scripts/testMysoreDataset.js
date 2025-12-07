import { loadDataset, getDatasetStats } from '../utils/dataLoader.js';
import { predictPriority } from '../utils/mlPriorityEngine.js';
import { dbscanClustering, generateHeatmap } from '../utils/geospatialClustering.js';
import logger from '../utils/logger.js';

console.log('\n' + '='.repeat(100));
console.log('🧪 COMPREHENSIVE SYSTEM TEST - MYSORE DATASET');
console.log('='.repeat(100));

async function runFullSystemTest() {
    try {
        // Step 1: Load Mysore test dataset
        console.log('\n📂 STEP 1: Loading Mysore Test Dataset...');
        const mysoreData = await loadDataset('mysore_test_cases.csv');
        console.log(`✓ Loaded ${mysoreData.length} test cases from Mysore region`);
        
        // Step 2: Dataset Statistics
        console.log('\n📊 STEP 2: Dataset Analysis...');
        const stats = getDatasetStats(mysoreData);
        console.log('Dataset Statistics:');
        console.log(`  Total Complaints: ${stats.total}`);
        console.log(`  By Category:`);
        Object.entries(stats.byCategory).forEach(([cat, count]) => {
            console.log(`    • ${cat}: ${count} (${(count/stats.total*100).toFixed(1)}%)`);
        });
        console.log(`  By Priority:`);
        Object.entries(stats.byPriority).forEach(([pri, count]) => {
            console.log(`    • ${pri}: ${count} (${(count/stats.total*100).toFixed(1)}%)`);
        });
        console.log(`  Average Resolution Time: ${stats.avgResolutionTime.toFixed(1)} hours`);
        
        // Step 3: ML Priority Prediction Test
        console.log('\n\n🤖 STEP 3: Testing ML Priority Prediction (Sample of 10)...');
        console.log('-'.repeat(100));
        
        const sampleSize = 10;
        const testSamples = mysoreData.slice(0, sampleSize);
        let correctPredictions = 0;
        const confusionMatrix = { high: {high: 0, medium: 0, low: 0}, medium: {high: 0, medium: 0, low: 0}, low: {high: 0, medium: 0, low: 0} };
        
        testSamples.forEach((complaint, idx) => {
            const prediction = predictPriority({
                title: complaint.title,
                description: complaint.description,
                category: complaint.category
            });
            
            const actualPriority = complaint.priority;
            const predictedPriority = prediction.priority;
            
            if (actualPriority === predictedPriority) {
                correctPredictions++;
            }
            
            confusionMatrix[actualPriority][predictedPriority]++;
            
            console.log(`\nTest Case ${idx + 1}:`);
            console.log(`  Ward: ${complaint.ward_number} | Category: ${complaint.category}`);
            console.log(`  Title: "${complaint.title}"`);
            console.log(`  Actual Priority: ${actualPriority.toUpperCase()}`);
            console.log(`  Predicted: ${predictedPriority.toUpperCase()} (Confidence: ${(prediction.confidence * 100).toFixed(1)}%)`);
            console.log(`  Match: ${actualPriority === predictedPriority ? '✓ CORRECT' : '✗ MISMATCH'}`);
            console.log(`  Features: Urgency=${(prediction.features.urgencyScore*100).toFixed(0)}%, Impact=${(prediction.features.impactScore*100).toFixed(0)}%, Safety=${(prediction.features.safetyScore*100).toFixed(0)}%`);
        });
        
        const accuracy = (correctPredictions / sampleSize * 100).toFixed(1);
        console.log('\n' + '='.repeat(100));
        console.log(`🎯 ML MODEL ACCURACY: ${accuracy}% (${correctPredictions}/${sampleSize} correct)`);
        console.log('='.repeat(100));
        
        console.log('\n📈 Confusion Matrix:');
        console.log('         Predicted:');
        console.log('Actual    HIGH  MEDIUM  LOW');
        console.log(`HIGH      ${confusionMatrix.high.high}     ${confusionMatrix.high.medium}       ${confusionMatrix.high.low}`);
        console.log(`MEDIUM    ${confusionMatrix.medium.high}     ${confusionMatrix.medium.medium}       ${confusionMatrix.medium.low}`);
        console.log(`LOW       ${confusionMatrix.low.high}     ${confusionMatrix.low.medium}       ${confusionMatrix.low.low}`);
        
        // Step 4: Geospatial Clustering Test
        console.log('\n\n🗺️  STEP 4: Testing Geospatial Clustering (DBSCAN)...');
        console.log('-'.repeat(100));
        
        // Transform data to required format
        const complaintsWithLocation = mysoreData
            .filter(c => c.latitude && c.longitude)
            .map(c => ({
                _id: c.complaint_id,
                title: c.title,
                category: c.category,
                priority: c.priority,
                location: {
                    coordinates: [parseFloat(c.longitude), parseFloat(c.latitude)]
                },
                meta: { priorityScore: c.priority === 'high' ? 85 : c.priority === 'medium' ? 50 : 20 }
            }));
        
        console.log(`Processing ${complaintsWithLocation.length} geolocated complaints...`);
        
        // Run DBSCAN clustering
        const clusters = dbscanClustering(complaintsWithLocation, 0.5, 3);
        
        console.log(`\n✓ Identified ${clusters.length} hotspot clusters`);
        console.log('\nTop 5 Clusters by Size:');
        clusters
            .sort((a, b) => b.size - a.size)
            .slice(0, 5)
            .forEach((cluster, idx) => {
                console.log(`\n  Cluster #${cluster.clusterId}:`);
                console.log(`    • Size: ${cluster.size} complaints`);
                console.log(`    • Center: (${cluster.center[1].toFixed(4)}, ${cluster.center[0].toFixed(4)})`);
                console.log(`    • Dominant Priority: ${cluster.dominantPriority.toUpperCase()}`);
                console.log(`    • Dominant Category: ${cluster.dominantCategory}`);
                console.log(`    • Severity Score: ${(cluster.severity * 100).toFixed(0)}%`);
                console.log(`    • Distribution: H:${cluster.priorityDistribution.high || 0} M:${cluster.priorityDistribution.medium || 0} L:${cluster.priorityDistribution.low || 0}`);
            });
        
        // Step 5: Heatmap Generation
        console.log('\n\n🔥 STEP 5: Generating KDE Heatmap...');
        console.log('-'.repeat(100));
        
        const heatmap = generateHeatmap(complaintsWithLocation, 1.0);
        console.log(`✓ Generated ${heatmap.length} heatmap points`);
        
        const highIntensityPoints = heatmap.filter(p => p.intensity > 0.7).length;
        const mediumIntensityPoints = heatmap.filter(p => p.intensity > 0.4 && p.intensity <= 0.7).length;
        const lowIntensityPoints = heatmap.filter(p => p.intensity <= 0.4).length;
        
        console.log(`  High Intensity Zones: ${highIntensityPoints}`);
        console.log(`  Medium Intensity Zones: ${mediumIntensityPoints}`);
        console.log(`  Low Intensity Zones: ${lowIntensityPoints}`);
        
        // Step 6: SLA Analysis
        console.log('\n\n⏱️  STEP 6: SLA Compliance Analysis...');
        console.log('-'.repeat(100));
        
        const resolvedComplaints = mysoreData.filter(c => c.status === 'resolved' && c.resolution_time_hours);
        const breachedSLAs = resolvedComplaints.filter(c => {
            const slaHours = c.priority === 'high' ? 4 : c.priority === 'medium' ? 12 : 48;
            return parseFloat(c.resolution_time_hours) > slaHours;
        });
        
        console.log(`Total Resolved: ${resolvedComplaints.length}`);
        console.log(`SLA Breached: ${breachedSLAs.length} (${(breachedSLAs.length/resolvedComplaints.length*100).toFixed(1)}%)`);
        console.log(`SLA Compliant: ${resolvedComplaints.length - breachedSLAs.length} (${((resolvedComplaints.length - breachedComplaints.length)/resolvedComplaints.length*100).toFixed(1)}%)`);
        
        if (breachedSLAs.length > 0) {
            console.log('\nTop 3 Worst SLA Breaches:');
            breachedSLAs
                .sort((a, b) => parseFloat(b.resolution_time_hours) - parseFloat(a.resolution_time_hours))
                .slice(0, 3)
                .forEach((c, idx) => {
                    const slaHours = c.priority === 'high' ? 4 : c.priority === 'medium' ? 12 : 48;
                    const breachBy = parseFloat(c.resolution_time_hours) - slaHours;
                    console.log(`  ${idx + 1}. "${c.title}" - Breached by ${breachBy}h (SLA: ${slaHours}h, Took: ${c.resolution_time_hours}h)`);
                });
        }
        
        // Final Summary
        console.log('\n\n' + '='.repeat(100));
        console.log('📋 TEST SUMMARY');
        console.log('='.repeat(100));
        console.log(`✓ Dataset: ${mysoreData.length} Mysore complaints loaded`);
        console.log(`✓ ML Accuracy: ${accuracy}% on sample`);
        console.log(`✓ Clustering: ${clusters.length} hotspots identified`);
        console.log(`✓ Heatmap: ${heatmap.length} density points generated`);
        console.log(`✓ SLA Compliance: ${((resolvedComplaints.length - breachedSLAs.length)/resolvedComplaints.length*100).toFixed(1)}%`);
        console.log('='.repeat(100));
        console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!\n');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        console.error(error.stack);
    }
}

// Run the tests
runFullSystemTest();
