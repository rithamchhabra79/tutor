import { GoogleGenerativeAI } from '@google/generative-ai';

// Confirmed working identifiers for 2026 SDK
export const MODELS = {
    PRIMARY: 'models/gemini-3.1-flash-lite-preview', // 500 RPD
    LOGIC: 'models/gemini-3-flash-preview',       // 20 RPD
    FALLBACK_1: 'models/gemini-2.5-flash',         // 20 RPD
    FALLBACK_2: 'models/gemini-2.5-flash-lite',    // 20 RPD
    SAFETY_NET: 'models/gemma-3-27b-it',           // 14.4K RPD
};

// Model selection based on task
export const getModelForTask = (taskType, roadmapType = null, mode = null) => {
    if (taskType === 'roadmap' && (roadmapType === 'master' || roadmapType === 'advance')) {
        return MODELS.LOGIC;
    }
    if (taskType === 'tutor' && mode === 'deep') {
        return MODELS.LOGIC;
    }
    // Default for everything else
    return MODELS.PRIMARY;
};

// Fallback chain definition
const FALLBACK_CHAIN = {
    [MODELS.PRIMARY]: [MODELS.FALLBACK_1, MODELS.FALLBACK_2, MODELS.SAFETY_NET],
    [MODELS.LOGIC]: [MODELS.FALLBACK_1, MODELS.SAFETY_NET],
};

/**
 * Execute a call with automatic failover
 */
export const executeWithAutoSwitch = async (apiKey, taskType, params, executeFn) => {
    const { roadmapType, mode, systemInstruction, generationConfig } = params;
    let currentModelName = getModelForTask(taskType, roadmapType, mode);
    let attempts = [currentModelName, ...(FALLBACK_CHAIN[currentModelName] || [])];
    
    let lastError = null;

    for (const modelName of attempts) {
        try {
            console.log(`🤖 Attempting request with model: ${modelName}`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction,
                generationConfig
            });
            
            // Execute the provided function with the selected model
            const result = await executeFn(model);
            console.log(`✅ Success using ${modelName}`);
            return { result, modelUsed: modelName };
        } catch (error) {
            lastError = error;
            const isRateLimit = error.status === 429 || error.message?.includes('429');
            const isQuotaExceeded = error.message?.includes('Quota exceeded');
            
            if (isRateLimit || isQuotaExceeded) {
                console.warn(`⚠️ Model ${modelName} hit limit. Switching to fallback...`);
                continue; // Try next model in chain
            } else {
                // For logic errors or auth errors, throw immediately
                throw error;
            }
        }
    }

    throw lastError || new Error("All models failed to respond.");
};

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
