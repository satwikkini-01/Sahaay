import Head from 'next/head';
import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function MLComparison() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeModel, setActiveModel] = useState('Ensemble (ML + Rules)');
    const [switchingModel, setSwitchingModel] = useState(false);

    useEffect(() => {
        loadResults();
        loadActiveModel();
    }, []);

    const loadResults = async () => {
        try {
            const res = await api.get('/api/ml/results');
            setResults(res.data);
        } catch (error) {
            console.error('Error loading results:', error);
        }
    };

    const loadActiveModel = async () => {
        try {
            const res = await api.get('/api/ml/active-model');
            setActiveModel(res.data.activeModel);
        } catch (error) {
            console.error('Error loading active model:', error);
        }
    };

    const runComparison = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/ml/compare');
            setResults(res.data);
        } catch (error) {
            console.error('Error running comparison:', error);
            alert('Error running comparison. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const selectModel = async (modelName) => {
        setSwitchingModel(true);
        try {
            await api.post('/api/ml/select-model', { modelName });
            setActiveModel(modelName);
            alert(`Model switched to: ${modelName}`);
        } catch (error) {
            console.error('Error switching model:', error);
            alert('Error switching model');
        } finally {
            setSwitchingModel(false);
        }
    };

    const getAccuracyColor = (accuracy) => {
        const acc = parseFloat(accuracy);
        if (acc >= 90) return 'text-green-600';
        if (acc >= 80) return 'text-blue-600';
        if (acc >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getAccuracyBg = (accuracy) => {
        const acc = parseFloat(accuracy);
        if (acc >= 90) return 'bg-green-100 border-green-300';
        if (acc >= 80) return 'bg-blue-100 border-blue-300';
        if (acc >= 70) return 'bg-yellow-100 border-yellow-300';
        return 'bg-red-100 border-red-300';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Head>
                <title>ML Model Comparison - Sahaay</title>
            </Head>

            {/* Header */}
            <div className="bg-white shadow-md border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">🤖 ML Model Comparison</h1>
                            <p className="text-gray-600 mt-1">Compare different machine learning algorithms for complaint priority prediction</p>
                        </div>
                        <button
                            onClick={runComparison}
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '🔄 Running Comparison...' : '▶️ Run Comparison'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                {/* Active Model Banner */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold opacity-90">CURRENTLY ACTIVE MODEL</p>
                            <h2 className="text-3xl font-bold mt-1">{activeModel}</h2>
                            <p className="text-sm opacity-90 mt-2">This model is currently being used for all complaint priority predictions</p>
                        </div>
                        <div className="text-5xl">✅</div>
                    </div>
                </div>

                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                        <p className="mt-4 text-gray-600 font-semibold">Training and evaluating models...</p>
                        <p className="text-sm text-gray-500 mt-2">This may take 10-30 seconds</p>
                    </div>
                )}

                {results && !loading && (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                                <p className="text-gray-600 text-sm font-semibold">Dataset Size</p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">{results.datasetSize}</p>
                                <p className="text-xs text-gray-500 mt-1">Total complaints</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                                <p className="text-gray-600 text-sm font-semibold">Training Set</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{results.trainSize}</p>
                                <p className="text-xs text-gray-500 mt-1">80% for training</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
                                <p className="text-gray-600 text-sm font-semibold">Test Set</p>
                                <p className="text-3xl font-bold text-purple-600 mt-2">{results.testSize}</p>
                                <p className="text-xs text-gray-500 mt-1">20% for testing</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
                                <p className="text-gray-600 text-sm font-semibold">Models Tested</p>
                                <p className="text-3xl font-bold text-orange-600 mt-2">{results.results?.length || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">Algorithms compared</p>
                            </div>
                        </div>

                        {/* Accuracy Comparison Chart */}
                        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">📊 Accuracy Comparison</h3>
                            <div className="space-y-4">
                                {results.results?.map((model, index) => (
                                    <div key={index} className="relative">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-700">{model.name}</span>
                                            <span className={`text-2xl font-bold ${getAccuracyColor(model.accuracy)}`}>
                                                {model.accuracy}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-8">
                                            <div
                                                className={`h-8 rounded-full flex items-center justify-end px-3 transition-all duration-1000 ${
                                                    parseFloat(model.accuracy) >= 90 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                                    parseFloat(model.accuracy) >= 80 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                                                    parseFloat(model.accuracy) >= 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                                    'bg-gradient-to-r from-red-400 to-red-600'
                                                }`}
                                                style={{ width: `${model.accuracy}%` }}
                                            >
                                                {index === 0 && <span className="text-white text-xs font-bold">🏆 BEST</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detailed Model Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {results.results?.map((model, index) => (
                                <div
                                    key={index}
                                    className={`bg-white rounded-xl p-6 shadow-lg border-2 transition-all ${
                                        activeModel === model.name ? 'border-green-500 ring-4 ring-green-200' : 'border-gray-200'
                                    }`}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-gray-800">{model.name}</h3>
                                        {index === 0 && <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">🏆 HIGHEST ACCURACY</span>}
                                        {activeModel === model.name && <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">✅ ACTIVE</span>}
                                    </div>

                                    {/* Accuracy Badge */}
                                    <div className={`${getAccuracyBg(model.accuracy)} border-2 rounded-lg p-4 mb-4`}>
                                        <p className="text-sm font-semibold text-gray-700">Overall Accuracy</p>
                                        <p className={`text-4xl font-bold ${getAccuracyColor(model.accuracy)}`}>{model.accuracy}%</p>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-600">Training Time</p>
                                            <p className="text-lg font-bold text-gray-800">{model.trainTime}ms</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-600">Memory Usage</p>
                                            <p className="text-lg font-bold text-gray-800">{model.memoryUsage}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                                            <p className="text-xs text-gray-600">Complexity</p>
                                            <p className="text-lg font-bold text-gray-800">{model.complexity}</p>
                                        </div>
                                    </div>

                                    {/* Priority-wise Metrics */}
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Priority-wise F1 Scores</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">High Priority:</span>
                                                <span className="font-semibold text-red-600">{model.highF1}%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Medium Priority:</span>
                                                <span className="font-semibold text-yellow-600">{model.mediumF1}%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Low Priority:</span>
                                                <span className="font-semibold text-green-600">{model.lowF1}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pros/Cons */}
                                    <div className="mb-4">
                                        <div className="mb-3">
                                            <p className="text-sm font-semibold text-green-700 mb-1">✓ Advantages</p>
                                            <ul className="text-xs text-gray-600 space-y-1">
                                                {model.pros?.map((pro, i) => (
                                                    <li key={i} className="flex items-start">
                                                        <span className="text-green-500 mr-1">•</span>
                                                        <span>{pro}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-red-700 mb-1">✗ Limitations</p>
                                            <ul className="text-xs text-gray-600 space-y-1">
                                                {model.cons?.map((con, i) => (
                                                    <li key={i} className="flex items-start">
                                                        <span className="text-red-500 mr-1">•</span>
                                                        <span>{con}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Select Button */}
                                    <button
                                        onClick={() => selectModel(model.name)}
                                        disabled={switchingModel || activeModel === model.name}
                                        className={`w-full py-3 rounded-lg font-semibold transition ${
                                            activeModel === model.name
                                                ? 'bg-green-100 text-green-800 cursor-default'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        } disabled:opacity-50`}
                                    >
                                        {activeModel === model.name ? '✅ Currently Active' : '🔄 Switch to This Model'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Timestamp */}
                        <div className="mt-8 text-center text-sm text-gray-500">
                            Last comparison run: {new Date(results.timestamp).toLocaleString()}
                        </div>
                    </>
                )}

                {!results && !loading && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                        <div className="text-6xl mb-4">🤖</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Results Yet</h3>
                        <p className="text-gray-600 mb-6">Click "Run Comparison" to train and evaluate all models</p>
                        <button
                            onClick={runComparison}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition"
                        >
                            ▶️ Run Comparison Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
