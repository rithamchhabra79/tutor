import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { Session } from './models/Session.js';
import { User } from './models/User.js';
import { encrypt, decrypt } from './utils/crypto.js';
import { requireAuth } from './middleware/auth.js';
import { isAdmin } from './middleware/admin.js';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
    console.error('❌ CRITICAL: MONGODB_URI is not defined in environment variables!');
} else {
    console.log('⏳ Attempting to connect to MongoDB...');
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        if (err.name === 'MongooseServerSelectionError') {
            console.error('👉 Tip: Check your IP Whitelist in MongoDB Atlas and ensure 0.0.0.0/0 is added.');
        }
    });

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

app.use(cors());
app.use(express.json());

// ==========================================
// AUTH & USER ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, phoneNumber, password } = req.body;
        if (!name || !email || !phoneNumber || !password) {
            return res.status(400).json({ error: "All fields (name, email, phone, password) are required" });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (existingUser) {
            const field = existingUser.email === email ? "Email" : "Phone number";
            return res.status(400).json({ error: `${field} is already registered` });
        }

        const user = new User({ name, email, phoneNumber, password });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, email: user.email, name: user.name, hasKey: false });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or phoneNumber
        if (!identifier || !password) return res.status(400).json({ error: "Identifier and password required" });

        const user = await User.findOne({ 
            $or: [
                { email: identifier }, 
                { phoneNumber: identifier }
            ] 
        });

        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, email: user.email, name: user.name, hasKey: !!user.encryptedApiKey });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

// Save/Update API Key
app.post('/api/auth/key', requireAuth, async (req, res) => {
    try {
        const { apiKey } = req.body;
        if (!apiKey) return res.status(400).json({ error: "API Key is required" });

        await User.findByIdAndUpdate(req.user._id, { encryptedApiKey: encrypt(apiKey) });

        res.json({ success: true, message: "API key saved securely." });
    } catch (err) {
        console.error("Key Save Error:", err);
        res.status(500).json({ error: "Failed to save API key" });
    }
});

// Remove API Key
app.delete('/api/auth/key', requireAuth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { encryptedApiKey: null });
        res.json({ success: true, message: "API key removed." });
    } catch (err) {
        console.error("Key Remove Error:", err);
        res.status(500).json({ error: "Failed to remove API key" });
    }
});

// Check Auth Status
app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ email: req.user.email, hasKey: !!req.user.encryptedApiKey });
});

// ==========================================
// SESSION MANAGEMENT (Now Auth-Protected)
// ==========================================
app.get('/api/sessions', requireAuth, async (req, res) => {
    try {
        const sessions = await Session.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(10);
        res.json(sessions);
    } catch (e) {
        console.error("Error fetching sessions:", e);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

app.post('/api/sessions', requireAuth, async (req, res) => {
    try {
        const { session } = req.body;
        await Session.findOneAndUpdate(
            { id: session.id, userId: req.user._id },
            { ...session, userId: req.user._id },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        res.json({ success: true });
    } catch (e) {
        console.error("Error syncing session:", e);
        res.status(500).json({ error: "Failed to sync session" });
    }
});

app.delete('/api/sessions/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await Session.findOneAndDelete({ id, userId: req.user._id });
        res.json({ success: true });
    } catch (e) {
        console.error("Error deleting session:", e);
        res.status(500).json({ error: "Failed to delete session" });
    }
});

// Helper for exponential backoff
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getGenerativeModelWithKey = (apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 2048,
            temperature: 0.7,
        },
        systemInstruction: `You are a Smart AI Tutor. ALWAYS respond with a single valid JSON object — no markdown, no text outside JSON.

ROLES:
- MANAGER: Build & track a topic roadmap. Know current step and total steps.
- TUTOR: Teach ONE concept at a time. Use Socratic method — don't directly give answers; ask guiding questions first.
- **NEVER** include the answer or even a hint to the \`mastery_check\` question within the \`explanation\` or \`analogy\` fields. The student must figure it out.

EXPLANATION STYLE:
- By DEFAULT: Provide clear, high-quality but CONCISE explanations (~100-150 words). Use bullet points.
- DEEP DIVE: If the user explicitly asks for "Deep Dive", "Vistaar se", or "Explain in detail", provide a molto-thorough, detailed technical breakdown with multiple examples.

JSON RESPONSE FORMAT (use this EXACT structure every time):
{
  "explanation": "Main concept explanation in student's language. Use markdown for formatting. Can include \`\`\`mermaid code blocks for diagrams. **REMINDER: No MCQ answers here.**",
  "analogy": "One short real-life analogy (1-2 lines max). null if not applicable.",
  "task": "One practical mini-task or exercise for the student. **MANDATORY** for every new concept taught.",
  "hint": "A helpful hint if student seems stuck. null otherwise.",
  "mastery_check": {
    "question": "A short MCQ or yes/no question to verify understanding",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "xp": 20
  },
  "progress": {
    "current_concept": "Name of concept being taught right now",
    "step": 1,
    "total_steps": 6
  },
  "xp_reward": 10,
  "redirect": null
}

RULES:
- Follow LANGUAGE (English/Hindi/Hinglish) and MODE (beginner/practical/deep) from the initial message.
- PROGRESSION & SOCRATIC METHOD: 
  - Be encouraging. 
  - **MANDATORY INTERACTION**: For every new concept, you must provide a 'task' AND a 'mastery_check' (MCQ).
  - You must wait for the student to attempt BOTH the task and the MCQ. 
  - In the next response, acknowledge their task attempt and MCQ result before moving to the next concept.
  - If the student provides a reasonable answer or a meaningful attempt, acknowledge it and move forward.
  - ONLY stay on the same concept if the reply is truly generic (e.g., "ok", "yes", "thik hai", "hmm") without any attempt to answer.
  - If they explicitly say "I don't know" or "Samajh nahi aaya", explain it simply and then move to the next concept.
- If student is OFF-TOPIC (asks about unrelated subject), set redirect field:
  "redirect": "🛑 Pehle [CURRENT_TOPIC] complete karo! [COMPLETED] concepts ho gaye. [NEXT] baaki hai. [NEW_TOPIC] baad mein seekhenge 💪"
  AND set explanation/task/mastery_check to null.
- Socratic Rule: If student asks something they SHOULD figure out — give a hint in 'hint' field, ask in mastery_check, don't directly explain in 'explanation'.
- mastery_check MUST always be present (never null) when teaching a new concept.
- xp_reward: 10 for explanation, 5 for hints, 0 for off-topic.
- END OF ROADMAP: Once step == total_steps and the final concept is explained/mastered, you MUST conclude the topic. Congratulate the student, provide a brief wrap-up in 'explanation', set 'task' to a suggested next topic, and set 'mastery_check' to null or a final "Are you ready to learn something new?" question. Do not keep asking questions on the same topic loop.`,
    });
};


// ==========================================
// EXPLORE ROUTE — Topic → Subtopic Options
// ==========================================
app.post('/api/explore', requireAuth, async (req, res) => {
    const { topic, language } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });
    if (!req.user.encryptedApiKey) return res.status(401).json({ error: 'API key missing' });

    const apiKey = decrypt(req.user.encryptedApiKey);
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 2048, temperature: 0.5 }
        });

        const prompt = `Generate exactly 6 subtopics for the topic: "${topic}".
Language: ${language || 'English'}.
Return ONLY this JSON (no explanation):
{"subtopics":[{"title":"Short Title","description":"One sentence.","emoji":"📌"}, ...]}
Each title: 2-4 words. Each description: 1 motivating sentence. Use relevant emojis.`;

        // Retry up to 3 times for 503
        let result;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                result = await model.generateContent(prompt);
                break;
            } catch (err) {
                if ((err.status === 503 || err.message?.includes('503')) && attempt < 3) {
                    console.log(`⚠️ Explore 503 attempt ${attempt}, retrying in 3s...`);
                    await wait(3000);
                } else throw err;
            }
        }

        const text = result.response.text().trim();
        console.log(`📚 Explore raw (${text.length} chars):`, text.substring(0, 200));

        let parsed = { subtopics: [] };
        try {
            parsed = JSON.parse(text);
        } catch {
            const jsonMatch = text.match(/\{[\s\S]*"subtopics"[\s\S]*\}/);
            if (jsonMatch) {
                try { parsed = JSON.parse(jsonMatch[0]); } catch { /* keep empty */ }
            }
        }

        console.log(`✅ Explore: ${parsed.subtopics?.length} subtopics for "${topic}"`);
        res.json(parsed);
    } catch (err) {
        console.error('Explore Error:', err.message);
        if (err.status === 429 || err.message?.includes('429')) {
            res.status(429).json({ error: 'Rate limit reach ho rhi h wait a few min' });
        } else if (err.status === 503 || err.message?.includes('503')) {
            res.status(503).json({ error: 'AI is busy right now. Please try again in a few seconds.' });
        } else {
            res.status(500).json({ error: err.message || 'Something went wrong' });
        }
    }
});

// ==========================================
// ROADMAP ROUTE — Subtopic → Learning Steps
// ==========================================
app.post('/api/roadmap', requireAuth, async (req, res) => {
    const { topic, subtopic, roadmapType, language } = req.body;
    if (!topic || !subtopic) return res.status(400).json({ error: 'Topic and subtopic required' });
    if (!req.user.encryptedApiKey) return res.status(401).json({ error: 'API key missing' });

    const apiKey = decrypt(req.user.encryptedApiKey);
    
    // Determine step count and token limit based on type
    let stepCount = 10;
    let maxTokens = 4096;

    if (roadmapType === 'short') {
        stepCount = 10;
        maxTokens = 4096;
    } else if (roadmapType === 'full') {
        stepCount = 20;
        maxTokens = 8192;
    } else if (roadmapType === 'master') {
        stepCount = 50;
        maxTokens = 12000;
    } else if (roadmapType === 'advance') {
        stepCount = 80;
        maxTokens = 16384;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { 
                responseMimeType: 'application/json', 
                maxOutputTokens: maxTokens, 
                temperature: 0.7 
            }
        });

        const prompt = `Create a learning roadmap with exactly ${stepCount} steps for: "${subtopic}" (from ${topic}).
Language: ${language || 'English'}.
Return ONLY valid JSON. It is CRITICAL that the JSON is complete and not truncated. 
Use VERY CONCISE descriptions (max 10 words) to ensure all ${stepCount} steps fit within the response limit.

JSON Structure:
{
  "steps": [
    {"step": 1, "title": "Short Title", "description": "Concise info.", "emoji": "🎯"},
    ...
  ],
  "estimated_time": "X hours",
  "difficulty": "Beginner/Intermediate/Advanced"
}
Each title: 2-4 words. Description: Max 10 words.`;

        // Retry up to 3 times for 503
        let result;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                result = await model.generateContent(prompt);
                break;
            } catch (err) {
                if ((err.status === 503 || err.message?.includes('503')) && attempt < 3) {
                    console.log(`⚠️ Roadmap 503 attempt ${attempt}, retrying in 3s...`);
                    await wait(3000);
                } else throw err;
            }
        }

        const text = result.response.text().trim();
        console.log(`🗺️ Roadmap raw (${text.length} chars):`, text.substring(0, 100) + "...");

        let parsed = { steps: [], estimated_time: '', difficulty: '' };
        
        // Clean markdown blocks and leading/trailing junk
        let cleanText = text.trim();
        if (cleanText.includes('```')) {
            const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (match) cleanText = match[1].trim();
        }

        try {
            parsed = JSON.parse(cleanText);
        } catch (jsonErr) {
            console.warn("⚠️ Initial JSON parse failed, attempting heuristic recovery...");
            // Brute force regex extraction for anything between first { and last }
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    parsed = JSON.parse(jsonMatch[0]);
                } catch (innerErr) {
                    console.error("❌ JSON parsing failed even after match extraction:", innerErr.message);
                    
                    // If it's still failing, it might be truncated at the end. 
                    // Let's try to close the JSON if it looks like a steps array that ended abruptly
                    if (cleanText.includes('"steps": [') && !cleanText.endsWith(']}')) {
                        console.log("🛠️ Attempting truncation recovery...");
                        let partial = cleanText;
                        // Find the last complete step object
                        const lastStepEnd = partial.lastIndexOf('}');
                        if (lastStepEnd !== -1) {
                            partial = partial.substring(0, lastStepEnd + 1) + ']}';
                            try {
                                parsed = JSON.parse(partial);
                                console.log("✅ Recovered partial JSON with", parsed.steps?.length, "steps");
                            } catch (e) { /* give up */ }
                        }
                    }
                }
            }
        }

        // Normalize 'Steps' vs 'steps' key
        if (!parsed.steps && parsed.Steps) parsed.steps = parsed.Steps;
        
        // Final fallback validation
        if (!parsed.steps || !Array.isArray(parsed.steps)) {
            parsed.steps = [];
        }

        console.log(`✅ Roadmap: ${parsed.steps?.length} steps for "${subtopic}"`);
        res.json(parsed);
    } catch (err) {
        console.error('Roadmap Error:', err.message);
        if (err.status === 503 || err.message?.includes('503')) {
            res.status(503).json({ error: 'AI is busy right now. Please try again in a few seconds.' });
        } else if (err.status === 429 || err.message?.includes('429')) {
            res.status(429).json({ error: 'Rate limit reach ho rhi h wait a few min' });
        } else {
            res.status(500).json({ error: 'Failed to generate roadmap' });
        }
    }
});

// ==========================================
// AI TUTOR ROUTE (Auth-Protected)
// ==========================================
app.post('/api/tutor', requireAuth, async (req, res) => {
    const { message, history, mode, language } = req.body;

    if (!req.user.encryptedApiKey) {
        return res.status(401).json({ error: "Gemini API Key is missing. Please save it in your settings." });
    }

    // Decrypt the AES stored API key
    const apiKey = decrypt(req.user.encryptedApiKey);

    if (!apiKey) {
        return res.status(500).json({ error: "Failed to decrypt API Key" });
    }

    try {
        const model = getGenerativeModelWithKey(apiKey);
        const chat = model.startChat({
            history: history || [],
        });

        const prompt = history && history.length > 0
            ? message
            : `[LANGUAGE: ${language}, MODE: ${mode}] I want to learn about: ${message}`;

        let result;
        let retries = 5;
        let delay = 5000; // Start with 5s delay

        while (retries > 0) {
            try {
                result = await chat.sendMessage(prompt);
                break; // Success!
            } catch (error) {
                // Check for 429 Too Many Requests
                if (error.status === 429 || error.message?.includes('429')) {
                    // Try to extract retry delay from Gemini error details
                    let waitTime = delay;
                    const retryInfo = error.errorDetails?.find(d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');

                    if (retryInfo?.retryDelay) {
                        // Parse "52s" -> 52000ms
                        const seconds = parseInt(retryInfo.retryDelay.replace('s', ''));
                        if (!isNaN(seconds)) {
                            waitTime = (seconds + 1) * 1000; // Add 1s buffer
                        }
                    }

                    console.log(`Rate limited. Waiting ${waitTime / 1000}s before retry... (${retries} left)`);
                    await wait(waitTime);
                    retries--;
                    delay *= 2; // Increase base delay for next time
                } else {
                    throw error;
                }
            }
        }

        if (!result) {
            throw new Error("Gemini is currently very busy. Please try again in a minute.");
        }

        const response = await result.response;
        const text = response.text();

        // Token usage log
        const usage = response.usageMetadata;
        if (usage) {
            console.log(`📊 Tokens → Input: ${usage.promptTokenCount}, Output: ${usage.candidatesTokenCount}, Total: ${usage.totalTokenCount}`);
        }

        // JSON parse karo — fallback with raw text agar parse fail ho
        let parsed = null;
        let cleanText = text.trim();

        // Robust extraction: find the first { and the last }
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }

        try {
            parsed = JSON.parse(cleanText);
            console.log(`✅ JSON parsed — concept: "${parsed?.progress?.current_concept}", step: ${parsed?.progress?.step}/${parsed?.progress?.total_steps}`);
        } catch (parseErr) {
            console.warn('⚠️ JSON parse failed:', parseErr.message);
            console.warn('Raw text:', text.substring(0, 100) + '...');
        }

        res.json({ message: cleanText || text, parsed });
    } catch (error) {
        console.error("Gemini Error:", error);
        if (error.status === 429 || error.message?.includes('429')) {
            res.status(429).json({ error: 'Rate limit reach ho rhi h wait a few min' });
        } else if (error.status === 503 || error.message?.includes('503')) {
            res.status(503).json({ error: 'AI is busy right now. Please try again in a few seconds.' });
        } else {
            res.status(500).json({ error: "Failed to get response from AI Tutor." });
        }
    }
});

// ============================================================
// SUMMARY MEMORY ENDPOINT (Auth-Protected)
// ============================================================
app.post('/api/summarize', requireAuth, async (req, res) => {
    const { history, topic, mode, language } = req.body;

    if (!req.user.encryptedApiKey) {
        return res.status(401).json({ error: "API key is required for summarization." });
    }

    const apiKey = decrypt(req.user.encryptedApiKey);

    if (!history || history.length < 2) {
        return res.status(400).json({ error: "Not enough history to summarize." });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const summaryModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const conversationText = history
            .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
            .join('\n');

        const prompt = `You are summarizing a tutoring session for memory compression. 
Output ONLY this exact structured format (no extra text):

TOPIC: ${topic}
LANGUAGE: ${language}
MODE: ${mode}
COMPLETED: [comma-separated list of concepts fully covered and confirmed by student]
STUDENT_LEVEL: [one line - what student understood well and what they struggled with]
LAST_TAUGHT: [the very last concept that was being explained]
NEXT_UP: [the next concept that should be taught next, based on the roadmap]
ROADMAP_PROGRESS: [e.g. "3 of 7 concepts done"]
PENDING_ACTION: [If there is an unanswered MCQ or a pending task from the Tutor, describe it briefly here. Otherwise write "None"]

Tutoring conversation to summarize:
${conversationText}`;

        const result = await summaryModel.generateContent(prompt);
        const summary = result.response.text().trim();

        console.log(`📝 Summary generated for topic: "${topic}"\n${summary}\n`);

        res.json({ summary });
    } catch (error) {
        console.error("Summary Error:", error);
        if (error.status === 429 || error.message?.includes('429')) {
            res.status(429).json({ error: 'Rate limit reach ho rhi h wait a few min' });
        } else {
            res.status(500).json({ error: "Failed to generate summary." });
        }
    }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get all users
app.get('/api/admin/users', requireAuth, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password -encryptedApiKey');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Delete user
app.delete('/api/admin/users/:id', requireAuth, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Session.deleteMany({ userId: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get all sessions
app.get('/api/admin/sessions', requireAuth, isAdmin, async (req, res) => {
    try {
        const sessions = await Session.find().populate('userId', 'email name phoneNumber').sort({ timestamp: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

app.listen(port, () => {
    console.log(`AI Tutor Backend running on http://localhost:${port}`);
});
