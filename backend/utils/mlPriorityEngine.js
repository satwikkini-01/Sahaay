import natural from 'natural';
import { loadDataset, preprocessData, trainTestSplit } from './dataLoader.js';
import logger from './logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TfIdf = natural.TfIdf;
const classifier = new natural.BayesClassifier();

// Cache for trained models
let tfIdfModel = null;
let isModelTrained = false;

/**
 * Train TF-IDF vectorizer and Random Forest-like classifier
 * Uses real dataset from CSV files
 */
export async function trainAdvancedModel() {
    try {
        logger.info('Loading training dataset...');
        
        // Load the generated dataset
        const datasetPath = path.join(__dirname, '../data/datasets/complaints_training.csv');
        let dataset;
        
        try {
            dataset = await loadDataset('complaints_training.csv');
        } catch (error) {
            logger.warn('Training dataset not found, using sample data');
            dataset = await loadDataset('complaints_sample.csv');
        }

        if (dataset.length === 0) {
            throw new Error('No training data available');
        }

        logger.info(`Training on ${dataset.length} examples...`);

        // Split dataset
        const { train, test } = trainTestSplit(dataset, 0.8);
        
        // Create TF-IDF vectorizer
        tfIdfModel = new TfIdf();
        
        // Add all training documents
        train.forEach((complaint, index) => {
            const text = `${complaint.title} ${complaint.description}`.toLowerCase();
            tfIdfModel.addDocument(text);
            
            // Train Naive Bayes classifier
            classifier.addDocument(text, complaint.priority);
        });

        // Train the classifier
        classifier.train();
        isModelTrained = true;

        // Evaluate on test set
        let correct = 0;
        test.forEach(complaint => {
            const text = `${complaint.title} ${complaint.description}`.toLowerCase();
            const predicted = classifier.classify(text);
            if (predicted === complaint.priority) correct++;
        });

        const accuracy = (correct / test.length * 100).toFixed(2);
        logger.info(`Model trained successfully! Accuracy: ${accuracy}%`);
        logger.info(`Training set: ${train.length}, Test set: ${test.length}`);

        // Return metadata without writing to file (prevents nodemon restart loop)
        return {
            success: true,
            accuracy,
            trainSize: train.length,
            testSize: test.length
        };

    } catch (error) {
        logger.error('Error training model:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Extract TF-IDF features from text
 * @param {string} text - Input complaint text
 * @param {string} category - Complaint category
 * @returns {Object} Feature vector
 */
function extractTfIdfFeatures(text, category = '') {
    const lowerText = text.toLowerCase();
    
    // Enhanced keyword lists
    const urgencyTerms = {
        high: ['urgent', 'emergency', 'critical', 'immediate', 'severe', 'asap', 'now', 'help'],
        medium: ['soon', 'quickly', 'fast', 'needed', 'problem', 'issue'],
        low: ['please', 'can', 'could', 'would', 'request']
    };
    
    const impactTerms = {
        high: ['multiple', 'many', 'entire', 'all', 'hundreds', 'thousands', 'whole', 'complete'],
        medium: ['several', 'few', 'area', 'building', 'block', 'hostel', 'apartment'],
        low: ['one', 'single', 'my', 'our', 'room']
    };
    
    const safetyTerms = {
        high: ['accident', 'hazard', 'danger', 'fire', 'shock', 'broken', 'burst', 'leak'],
        medium: ['unsafe', 'risk', 'damage', 'fault', 'crack', 'problem'],
        low: ['concern', 'worry', 'issue']
    };

    // Category-specific scoring
    const categoryScores = {
        water: { urgency: 0.4, impact: 0.5, safety: 0.4 },
        electricity: { urgency: 0.6, impact: 0.4, safety: 0.7 },
        roads: { urgency: 0.5, impact: 0.6, safety: 0.6 },
        sanitation: { urgency: 0.5, impact: 0.5, safety: 0.5 },
        transport: { urgency: 0.3, impact: 0.4, safety: 0.4 },
        default: { urgency: 0.3, impact: 0.3, safety: 0.3 }
    };

    // Get base scores from category
    const baseScores = categoryScores[category] || categoryScores.default;

    // Calculate keyword-based scores
    let urgencyScore = baseScores.urgency;
    let impactScore = baseScores.impact;
    let safetyScore = baseScores.safety;

    // Check urgency terms
    urgencyTerms.high.forEach(term => {
        if (lowerText.includes(term)) urgencyScore = Math.min(urgencyScore + 0.25, 1.0);
    });
    urgencyTerms.medium.forEach(term => {
        if (lowerText.includes(term)) urgencyScore = Math.min(urgencyScore + 0.15, 1.0);
    });

    // Check impact terms
    impactTerms.high.forEach(term => {
        if (lowerText.includes(term)) impactScore = Math.min(impactScore + 0.25, 1.0);
    });
    impactTerms.medium.forEach(term => {
        if (lowerText.includes(term)) impactScore = Math.min(impactScore + 0.15, 1.0);
    });

    // Check safety terms
    safetyTerms.high.forEach(term => {
        if (lowerText.includes(term)) safetyScore = Math.min(safetyScore + 0.25, 1.0);
    });
    safetyTerms.medium.forEach(term => {
        if (lowerText.includes(term)) safetyScore = Math.min(safetyScore + 0.15, 1.0);
    });

    // Text complexity scoring
    const wordCount = text.split(/\s+/).length;
    const complexityBonus = Math.min(wordCount / 100, 0.2); // Bonus for detailed complaints
    
    urgencyScore = Math.min(urgencyScore + complexityBonus, 1.0);
    impactScore = Math.min(impactScore + complexityBonus, 1.0);

    // TF-IDF model scoring (if available)
    let tfIdfScore = 0.3; // Base score
    if (tfIdfModel && isModelTrained) {
        // Add document temporarily to get TF-IDF scores
        const docIndex = tfIdfModel.documents.length;
        tfIdfModel.addDocument(lowerText);
        
        // Get top terms and their scores
        const terms = tfIdfModel.listTerms(docIndex);
        if (terms && terms.length > 0) {
            // Average top 5 TF-IDF scores
            const topScores = terms.slice(0, 5).map(t => t.tfidf);
            tfIdfScore = topScores.reduce((a, b) => a + b, 0) / topScores.length;
            tfIdfScore = Math.min(tfIdfScore / 10, 1.0); // Normalize
        }
    }

    return {
        wordCount,
        urgencyScore: Math.max(0.1, urgencyScore), // Minimum 10%
        impactScore: Math.max(0.1, impactScore),   // Minimum 10%
        safetyScore: Math.max(0.1, safetyScore),   // Minimum 10%
        tfIdfScore: Math.max(0.2, tfIdfScore),     // Minimum 20%
        overallSeverity: (urgencyScore + impactScore + safetyScore) / 3
    };
}

/**
 * Advanced priority prediction using ensemble approach
 * @param {Object} complaint - Complaint object with title and description
 * @returns {Object} Prediction result with confidence scores
 */
export function predictPriority(complaint) {
    const text = `${complaint.title} ${complaint.description}`.toLowerCase();
    const category = (complaint.category || '').toLowerCase();

    if (!isModelTrained) {
        // Initialize training automatically
        trainAdvancedModel().catch(err => {
            logger.error('Auto-training failed:', err);
        });
    }

    // Get Naive Bayes prediction with probabilities
    const fullText = `${text} ${category}`;
    const nbPrediction = classifier.classify(fullText);
    const nbConfidences = classifier.getClassifications(fullText);

    // Extract TF-IDF features with category context
    const tfIdfFeatures = extractTfIdfFeatures(text, category);

    // Ensemble decision: combine Naive Bayes and TF-IDF features
    let finalPriority = nbPrediction;
    const nbConfidence = nbConfidences.find(c => c.label === nbPrediction)?.value || 0.5;

    // Boost priority based on TF-IDF features
    if (tfIdfFeatures.overallSeverity > 0.7 && nbPrediction === 'medium') {
        finalPriority = 'high';
    } else if (tfIdfFeatures.overallSeverity < 0.3 && nbPrediction === 'medium') {
        finalPriority = 'low';
    }

    // Calculate confidence scores for all priorities
    const confidenceScores = {
        high: nbConfidences.find(c => c.label === 'high')?.value || 0,
        medium: nbConfidences.find(c => c.label === 'medium')?.value || 0,
        low: nbConfidences.find(c => c.label === 'low')?.value || 0
    };

    return {
        priority: finalPriority,
        confidence: nbConfidence.toFixed(3),
        confidenceScores,
        features: {
            nbPrediction,
            tfIdfScore: tfIdfFeatures.tfIdfScore.toFixed(3),
            urgencyScore: tfIdfFeatures.urgencyScore.toFixed(3),
            impactScore: tfIdfFeatures.impactScore.toFixed(3),
            safetyScore: tfIdfFeatures.safetyScore.toFixed(3)
        },
        explanation: `Classified as ${finalPriority} with ${(nbConfidence * 100).toFixed(1)}% confidence. ` +
                    `Urgency: ${(tfIdfFeatures.urgencyScore * 100).toFixed(0)}%, ` +
                    `Impact: ${(tfIdfFeatures.impactScore * 100).toFixed(0)}%, ` +
                    `Safety: ${(tfIdfFeatures.safetyScore * 100).toFixed(0)}%`
    };
}

// Auto-train on module load
trainAdvancedModel().catch(err => {
    logger.warn('Initial model training failed, will retry on first prediction', err);
});

export default { predictPriority, trainAdvancedModel };
