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
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password required" });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email is already registered" });

        const user = new User({ email, password });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, email: user.email, hasKey: false });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, email: user.email, hasKey: !!user.encryptedApiKey });
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

        req.user.encryptedApiKey = encrypt(apiKey);
        await req.user.save();
        
        res.json({ success: true, message: "API key saved securely." });
    } catch (err) {
        console.error("Key Save Error:", err);
        res.status(500).json({ error: "Failed to save API key" });
    }
});

// Remove API Key
app.delete('/api/auth/key', requireAuth, async (req, res) => {
    try {
        req.user.encryptedApiKey = null;
        await req.user.save();
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
            { upsert: true, new: true, setDefaultsOnInsert: true }
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
            maxOutputTokens: 1200,
            temperature: 0.7,
        },
        systemInstruction: `You are a Smart AI Tutor. ALWAYS respond with a single valid JSON object — no markdown, no text outside JSON.

ROLES:
- MANAGER: Build & track a topic roadmap. Know current step and total steps.
- TUTOR: Teach ONE concept at a time. Use Socratic method — don't directly give answers; ask guiding questions first.

JSON RESPONSE FORMAT (use this EXACT structure every time):
{
  "explanation": "Main concept explanation in student's language. Use markdown for formatting. Can include \`\`\`mermaid code blocks for diagrams.",
  "analogy": "One short real-life analogy (1-2 lines max). null if not applicable.",
  "task": "One practical mini-task or exercise for the student. null if this is an answer to student's question.",
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
- STRICT PROGRESSION: If the student replies with generic words like 'okay', 'yes', 'thik hai', 'hmm', DO NOT move to the next concept. You MUST require them to answer the previous question, attempt the task, or explicitly say "I don't know, please explain" before teaching the next concept. If they give a generic reply, ask them to answer the question first.
- If student is OFF-TOPIC (asks about unrelated subject), set redirect field:
  "redirect": "🛑 Pehle [CURRENT_TOPIC] complete karo! [COMPLETED] concepts ho gaye. [NEXT] baaki hai. [NEW_TOPIC] baad mein seekhenge 💪"
  AND set explanation/task/mastery_check to null.
- Socratic Rule: If student asks something they SHOULD figure out — give a hint in 'hint' field, ask in mastery_check, don't directly explain in 'explanation'.
- mastery_check MUST always be present (never null) when teaching a new concept.
- xp_reward: 10 for explanation, 5 for hints, 0 for off-topic.
- END OF ROADMAP: Once step == total_steps and the final concept is explained/mastered, you MUST conclude the topic. Congratulate the student, provide a brief wrap-up in 'explanation', set 'task' to a suggested next topic, and set 'mastery_check' to null or a final "Are you ready to learn something new?" question. Do not keep asking questions on the same topic loop.
- Keep explanation concise (max 150 words). Use bullet points.`,
    });
};


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
        res.status(500).json({ error: "Failed to get response from AI Tutor." });
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

Tutoring conversation to summarize:
${conversationText}`;

        const result = await summaryModel.generateContent(prompt);
        const summary = result.response.text().trim();

        console.log(`📝 Summary generated for topic: "${topic}"\n${summary}\n`);

        res.json({ summary });
    } catch (error) {
        console.error("Summary Error:", error);
        res.status(500).json({ error: "Failed to generate summary." });
    }
});

app.listen(port, () => {
    console.log(`AI Tutor Backend running on http://localhost:${port}`);
});
