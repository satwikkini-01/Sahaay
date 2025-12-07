import express from 'express';
import { compareModels } from '../scripts/compareModels.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * @route   GET /api/ml/compare
 * @desc    Run model comparison and return results
 * @access  Public (for demonstration)
 */
router.get('/compare', async (req, res) => {
    try {
        logger.info('Running ML model comparison...');
        const results = await compareModels();
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });
    } catch (error) {
        logger.error('Model comparison error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/ml/results
 * @desc    Get cached comparison results
 * @access  Public
 */
router.get('/results', async (req, res) => {
    try {
        const resultsPath = path.join(__dirname, '../data/model_comparison_results.json');
        
        try {
            const data = await fs.readFile(resultsPath, 'utf-8');
            const results = JSON.parse(data);
            res.json(results);
        } catch (error) {
            // No cached results, run comparison
            logger.info('No cached results, running comparison...');
            const results = await compareModels();
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                results
            });
        }
    } catch (error) {
        logger.error('Error fetching results:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/ml/select-model
 * @desc    Select active model for predictions
 * @access  Admin
 */
router.post('/select-model', async (req, res) => {
    try {
        const { modelName } = req.body;
        
        const validModels = ['Naive Bayes', 'Logistic Regression', 'Decision Tree', 'Ensemble (ML + Rules)'];
        
        if (!validModels.includes(modelName)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid model name',
                validModels
            });
        }
        
        // Save selected model to config
        const configPath = path.join(__dirname, '../data/active_model.json');
        await fs.writeFile(configPath, JSON.stringify({
            activeModel: modelName,
            updatedAt: new Date().toISOString()
        }, null, 2));
        
        logger.info(`Active model changed to: ${modelName}`);
        
        res.json({
            success: true,
            activeModel: modelName,
            message: `Model switched to ${modelName}`
        });
    } catch (error) {
        logger.error('Error selecting model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/ml/active-model
 * @desc    Get currently active model
 * @access  Public
 */
router.get('/active-model', async (req, res) => {
    try {
        const configPath = path.join(__dirname, '../data/active_model.json');
        
        try {
            const data = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(data);
            res.json(config);
        } catch (error) {
            // Default to Ensemble
            res.json({
                activeModel: 'Ensemble (ML + Rules)',
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        logger.error('Error fetching active model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
