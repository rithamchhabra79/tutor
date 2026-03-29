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
    if (taskType === 'roadmap' || taskType === 'course-structure' || taskType === 'course-book-index') {
        return MODELS.LOGIC;
    }
    if (taskType === 'tutor' && mode === 'deep') {
        return MODELS.LOGIC;
    }
    // Default for everything else
    return MODELS.PRIMARY;
};

// Note: Fallback chain is now handled dynamically in executeWithAutoSwitch

/**
 * Execute a call with automatic failover (Upgraded)
 * Tries the primary model first, then exhausts all other models if "busy" or "limited"
 */
export const executeWithAutoSwitch = async (apiKey, taskType, params, executeFn) => {
    const { roadmapType, mode, systemInstruction, generationConfig } = params;
    
    // 1. Determine the best starting model
    const primaryChoice = getModelForTask(taskType, roadmapType, mode);
    
    // 2. Build a full exhaustive list: [Primary Choice, then all others in priority order]
    // Priority order: FLASH -> LOGIC -> FB1 -> FB2 -> SAFETY
    const allModelsPriority = [
        MODELS.PRIMARY, 
        MODELS.LOGIC, 
        MODELS.FALLBACK_1, 
        MODELS.FALLBACK_2, 
        MODELS.SAFETY_NET
    ];
    
    // Filter duplicates and put primaryChoice at the front
    let attempts = [primaryChoice, ...allModelsPriority.filter(m => m !== primaryChoice)];
    
    let lastError = null;

    for (const modelName of attempts) {
        try {
            console.log(`🤖 Attempting [${taskType}] with model: ${modelName}`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction,
                generationConfig
            });
            
            // Execute the provided function with the selected model
            // Add a timeout fallback for hanging requests
            const result = await Promise.race([
                executeFn(model),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Model request timeout")), 30000))
            ]);

            console.log(`✅ Success using ${modelName} for ${taskType}`);
            return { result, modelUsed: modelName };
        } catch (error) {
            lastError = error;
            const errorMsg = error.message?.toLowerCase() || "";
            const status = error.status;

            // Broad check for "Busy" or "Limited" states
            const isBusy = 
                status === 429 || status === 500 || status === 503 ||
                errorMsg.includes('429') || errorMsg.includes('500') || errorMsg.includes('503') ||
                errorMsg.includes('quota exceeded') || 
                errorMsg.includes('busy') || 
                errorMsg.includes('overloaded') || 
                errorMsg.includes('capacity') ||
                errorMsg.includes('timeout') ||
                errorMsg.includes('service_unavailable');

            if (isBusy) {
                console.warn(`⚠️ Model ${modelName} is busy/limited: "${error.message}". Switching to next available...`);
                continue; // Try next model in exhaustive list
            } else {
                // If it's a safety block or auth error, we might still want to try another model 
                // as different models have different filters, but for now we fallback on almost anything 
                // that isn't a clear developer error.
                console.warn(`⏳ Model ${modelName} failed with: "${error.message}". Retrying with fallback...`);
                continue;
            }
        }
    }

    console.error("❌ ALL models failed. Final error:", lastError.message);
    throw lastError || new Error("All models failed to respond.");
};

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
