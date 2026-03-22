import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
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
import { executeWithAutoSwitch, MODELS, wait } from './utils/gemini.js';
import { SYSTEM_INSTRUCTIONS, getExplorePrompt, getRoadmapPrompt, getSummaryPrompt, getNotesPrompt } from './utils/prompts.js';

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

if (!process.env.JWT_SECRET) {
    console.error('❌ CRITICAL: JWT_SECRET is not defined in environment variables!');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting for Auth Routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});

// ==========================================
// AUTH & USER ROUTES
// ==========================================

// Register
app.post('/api/auth/register', authLimiter, async (req, res) => {
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
app.post('/api/auth/login', authLimiter, async (req, res) => {
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

// Helpers removed and replaced by utils/gemini.js


// ==========================================
// EXPLORE ROUTE — Topic → Subtopic Options
// ==========================================
app.post('/api/explore', requireAuth, async (req, res) => {
    const { topic, language } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });
    if (!req.user.encryptedApiKey) return res.status(401).json({ error: 'API key missing' });

    const apiKey = decrypt(req.user.encryptedApiKey);
    try {
        const prompt = getExplorePrompt(topic, language);

        const { result, modelUsed } = await executeWithAutoSwitch(apiKey, 'explore', {}, async (model) => {
            return await model.generateContent(prompt);
        });

        const text = result.response.text().trim();
        // Sensitive log removed for security

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

    // Determine step count based on type
    let stepCount = 10;
    if (roadmapType === 'full') stepCount = 20;
    else if (roadmapType === 'master') stepCount = 50;
    else if (roadmapType === 'advance') stepCount = 80;

    try {
        const prompt = getRoadmapPrompt(subtopic, topic, stepCount, language);

        const { result, modelUsed } = await executeWithAutoSwitch(
            apiKey,
            'roadmap',
            { roadmapType },
            async (model) => {
                return await model.generateContent(prompt);
            }
        );

        const text = result.response.text().trim();
        // Sensitive log removed for security

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
        const generationConfig = {
            responseMimeType: "application/json",
            maxOutputTokens: 2048,
            temperature: 0.7,
        };

        const { result, modelUsed } = await executeWithAutoSwitch(
            apiKey,
            'tutor',
            { mode, systemInstruction: SYSTEM_INSTRUCTIONS, generationConfig },
            async (model) => {
                const chat = model.startChat({ history: history || [] });
                const prompt = history && history.length > 0
                    ? message
                    : `[LANGUAGE: ${language}, MODE: ${mode}] I want to learn about: ${message}`;
                return await chat.sendMessage(prompt);
            }
        );

        if (!result) {
            throw new Error("Gemini is currently very busy. Please try again in a minute.");
        }

        const response = await result.response;
        const text = response.text();

        // Token usage log
        const usage = response.usageMetadata;
        if (usage) {
            console.log(`📊 (Model: ${modelUsed}) Tokens → Input: ${usage.promptTokenCount}, Output: ${usage.candidatesTokenCount}, Total: ${usage.totalTokenCount}`);
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
        const conversationText = history
            .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
            .join('\n');

        const prompt = getSummaryPrompt(conversationText, topic, language, mode);

        const { result, modelUsed } = await executeWithAutoSwitch(
            apiKey,
            'summarize',
            { mode },
            async (model) => {
                return await model.generateContent(prompt);
            }
        );

        const summary = result.response.text().trim();

        console.log(`📝 Summary generated (Model: ${modelUsed}) for topic: "${topic}"\n${summary}\n`);

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

// ============================================================
// NOTES GENERATOR ENDPOINT (Auth-Protected)
// ============================================================
app.post('/api/notes/generate', requireAuth, async (req, res) => {
    const { history, topic, language } = req.body;

    if (!req.user.encryptedApiKey) {
        return res.status(401).json({ error: "API key is required for note generation." });
    }

    const apiKey = decrypt(req.user.encryptedApiKey);

    if (!history || history.length < 1) {
        return res.status(400).json({ error: "No history found to generate notes." });
    }

    try {
        const conversationText = history
            .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
            .join('\n');

        const prompt = getNotesPrompt(conversationText, topic, language);

        const { result, modelUsed } = await executeWithAutoSwitch(
            apiKey,
            'notes',
            {},
            async (model) => {
                return await model.generateContent(prompt);
            }
        );

        const notes = result.response.text().trim();
        console.log(`📝 Notes generated (Model: ${modelUsed}) for topic: "${topic}"`);

        res.json({ notes });
    } catch (error) {
        console.error("Notes Error:", error);
        if (error.status === 429 || error.message?.includes('429')) {
            res.status(429).json({ error: 'Rate limit reach ho rhi h wait a few min' });
        } else {
            res.status(500).json({ error: "Failed to generate notes." });
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
