import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, BookOpen, GraduationCap, ChevronRight, Loader2, RefreshCcw, Languages, Lightbulb, CheckSquare, History, Trash2, ArrowLeft, User, Settings, LogOut, Key, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import './App.css';

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#fff',
        primaryBorderColor: '#6366f1',
        lineColor: '#6366f1',
        secondaryColor: '#10b981',
        tertiaryColor: '#1e293b'
    }
});

const Mermaid = ({ chart }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && chart) {
            mermaid.contentLoaded();
            // Force re-render of mermaid
            const renderDiagram = async () => {
                try {
                    ref.current.removeAttribute('data-processed');
                    await mermaid.run({
                        nodes: [ref.current],
                    });
                } catch (e) {
                    console.error("Mermaid Render Error:", e);
                }
            };
            renderDiagram();
        }
    }, [chart]);

    return (
        <div className="mermaid-container" style={{ minHeight: '100px', display: 'flex', justifyContent: 'center' }}>
            <div className="mermaid" ref={ref} style={{ visibility: chart ? 'visible' : 'hidden' }}>
                {chart}
            </div>
            {!chart && <div className="mermaid-placeholder">Rendering chart...</div>}
        </div>
    );
};

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/tutor`;

function App() {
    const [topic, setTopic] = useState('');
    const [mode, setMode] = useState('beginner');
    const [language, setLanguage] = useState('English');

    // Auth States
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [showProfile, setShowProfile] = useState(false);
    const [authForm, setAuthForm] = useState({ email: '', password: '', confirmPassword: '' });

    // API Key States
    const [apiKey, setApiKey] = useState('');
    const [isApiKeySet, setIsApiKeySet] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const [isStarted, setIsStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastPrompt, setLastPrompt] = useState('');
    const [sessions, setSessions] = useState([]);
    const [conversationSummary, setConversationSummary] = useState('');
    const [showExitWarning, setShowExitWarning] = useState(false);
    // ⚡ XP + Progress (Feature 3)
    const [xp, setXp] = useState(0);
    const [streak, setStreak] = useState(0);
    const [progress, setProgress] = useState({ step: 0, total_steps: 0, current_concept: '' });
    // 🤔 MCQ State (Feature 2 - Socratic)
    const [mcqState, setMcqState] = useState({}); // { [msgIndex]: { selected, submitted } }

    // 🗺️ EXPLORE FLOW STATE
    const [appStage, setAppStage] = useState('home');
    const [subtopics, setSubtopics] = useState([]);
    const [selectedSubtopics, setSelectedSubtopics] = useState([]);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [roadmapData, setRoadmapData] = useState(null);
    const [roadmapType, setRoadmapType] = useState('full');
    const [allSelected, setAllSelected] = useState(false);
    // 👁️ Show/hide toggles
    const [showKey, setShowKey] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const chatEndRef = useRef(null);

    // Load sessions and check auth status on mount
    useEffect(() => {
        const checkAuthAndFetchSessions = async () => {
            const token = localStorage.getItem('ai-tutor-token');
            if (!token) {
                setIsAuthenticated(false);
                return;
            }

            try {
                // Verify Token & Get Status
                const meRes = await axios.get(`${BASE_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setIsAuthenticated(true);
                setUserEmail(meRes.data.email);
                setIsApiKeySet(meRes.data.hasKey);

                // Fetch user's sessions from DB
                const sessionRes = await axios.get(`${BASE_URL}/api/sessions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSessions(sessionRes.data);

            } catch (e) {
                console.error("Auth check failed:", e);
                setIsAuthenticated(false);
                localStorage.removeItem('ai-tutor-token');
            }
        };

        checkAuthAndFetchSessions();
    }, []);

    // Sync session to backend helper
    const syncSession = async (session) => {
        const token = localStorage.getItem('ai-tutor-token');
        if (!token) return;

        try {
            await axios.post(`${BASE_URL}/api/sessions`, { session }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {
            console.error("Error syncing session:", e);
        }
        setSessions(prev => {
            const updated = prev.findIndex(s => s.id === session.id) !== -1
                ? prev.map(s => s.id === session.id ? session : s)
                : [session, ...prev.slice(0, 9)];
            localStorage.setItem('ai-tutor-sessions', JSON.stringify(updated));
            return updated;
        });
    };

    // 🧠 ROLLING SUMMARY MEMORY
    const triggerSummary = async (currentMessages, currentTopic, currentMode, currentLanguage) => {
        if (currentMessages.length < 6) return;

        const token = localStorage.getItem('ai-tutor-token');
        if (!token) return;

        try {
            const res = await axios.post(`${BASE_URL}/api/summarize`, {
                history: currentMessages,
                topic: currentTopic,
                mode: currentMode,
                language: currentLanguage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newSummary = res.data.summary;
            setConversationSummary(newSummary);
            console.log('🧠 Summary Memory Updated:\n', newSummary);
            return newSummary;
        } catch (e) {
            console.warn('Summary generation failed (non-critical):', e.message);
            return null;
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Step 1: Topic submit → fetch subtopics
    const handleTopicExplore = async (e) => {
        e.preventDefault();
        if (!topic.trim() || !isApiKeySet) return;
        setIsLoading(true);
        setError(null);
        setSubtopics([]);
        const token = localStorage.getItem('ai-tutor-token');
        try {
            const res = await axios.post(`${BASE_URL}/api/explore`, { topic, language }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const subs = res.data.subtopics || [];
            if (subs.length === 0) {
                setError('AI ne subtopics generate nahi kiye. Dobara try karo.');
                return;
            }
            setSubtopics(subs);
            setAppStage('explore');
        } catch (err) {
            const msg = err.response?.data?.error || '';
            if (err.response?.status === 503 || msg.includes('busy')) {
                setError('⚠️ AI abhi busy hai. 5 seconds baad retry karo.');
            } else {
                setError('Subtopics load nahi hue. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Toggle subtopic selection (multi-select)
    const handleSubtopicClick = (subtopic) => {
        setSelectedSubtopics(prev => {
            const isSelected = prev.some(s => s.title === subtopic.title);
            const updated = isSelected
                ? prev.filter(s => s.title !== subtopic.title)
                : [...prev, subtopic];
            setAllSelected(updated.length === subtopics.length);
            return updated;
        });
    };

    // Select All / Deselect All
    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedSubtopics([]);
            setAllSelected(false);
        } else {
            setSelectedSubtopics([...subtopics]);
            setAllSelected(true);
        }
    };

    // Continue from explore to roadmap-choice
    const handleExploreContinue = () => {
        if (selectedSubtopics.length === 0) return;
        // Use first selected as the primary subtopic for the roadmap
        setSelectedSubtopic(selectedSubtopics[0]);
        setAppStage('roadmap-choice');
    };

    // Step 3: Roadmap type chosen → fetch roadmap
    const handleRoadmapFetch = async (type) => {
        setRoadmapType(type);
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('ai-tutor-token');
        const subtopicTitle = selectedSubtopics.length > 1
            ? selectedSubtopics.map(s => s.title).join(', ')
            : (selectedSubtopic?.title || selectedSubtopics[0]?.title);
        try {
            const res = await axios.post(`${BASE_URL}/api/roadmap`, {
                topic,
                subtopic: subtopicTitle,
                roadmapType: type,
                language
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const rd = res.data;
            if (!rd.steps || rd.steps.length === 0) {
                setError('Roadmap generate nahi hua. Dobara try karo.');
                return;
            }
            setRoadmapData(rd);
            setAppStage('roadmap');
        } catch (err) {
            const msg = err.response?.data?.error || '';
            if (err.response?.status === 503 || msg.includes('busy')) {
                setError('⚠️ AI abhi busy hai. 5 seconds baad retry karo.');
            } else {
                setError('Roadmap load nahi hua. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Step 4: Start Learning from roadmap
    const startTutor = async () => {
        const subtopicTitle = selectedSubtopics.length > 1
            ? selectedSubtopics.map(s => s.title).join(' + ')
            : (selectedSubtopic?.title || selectedSubtopics[0]?.title || '');
        const learningTopic = subtopicTitle ? `${topic} - ${subtopicTitle}` : topic;
        setIsStarted(true);
        setIsLoading(true);
        setConversationSummary('');
        setAppStage('learning');

        const token = localStorage.getItem('ai-tutor-token');
        const roadmapContext = roadmapData
            ? `The student has chosen a ${roadmapType} roadmap with ${roadmapData.steps?.length} steps: ${roadmapData.steps?.map(s => s.title).join(', ')}. Start teaching from step 1: "${roadmapData.steps?.[0]?.title}".`
            : '';

        try {
            const res = await axios.post(API_URL, {
                message: `${roadmapContext} I want to learn: ${learningTopic}`,
                mode: mode,
                language: language,
                history: []
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const initialUserMsg = { role: 'user', content: `Teach me about: ${learningTopic}` };
            const initialModelMsg = { role: 'model', content: res.data.message, parsed: res.data.parsed };
            const initialHistory = [initialUserMsg, initialModelMsg];

            setMessages(initialHistory);
            setTopic(learningTopic);

            const newSession = {
                id: Date.now().toString(),
                topic: learningTopic,
                mode: mode,
                language: language,
                messages: initialHistory,
                summary: '',
                timestamp: Date.now()
            };
            syncSession(newSession);
        } catch (err) {
            setMessages([{ role: 'model', content: '❌ Error connecting to the tutor. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (e, retryInput = null) => {
        if (e) e.preventDefault();
        const finalInput = retryInput || input;
        if (!finalInput.trim() || isLoading) return;

        setError(null); // Clear previous errors
        setLastPrompt(finalInput); // Save for retry

        // If not a retry, add user message to UI
        if (!retryInput) {
            const userMsg = { role: 'user', content: finalInput };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
        }

        setIsLoading(true);

        try {
            // ============================================================
            // 🧠 SUMMARY MEMORY — Smart History Builder
            // Agar summary hai → summary + last 4 msgs bhejo (max ~500 tokens)
            // Agar summary nahi → puri history (first 6 msgs tak hi hogi)
            // ============================================================
            let history = [];

            if (conversationSummary && messages.length > 6) {
                // SUMMARY MODE: Anchor message + recent context
                const summaryAnchor = {
                    role: 'user',
                    parts: [{ text: `[SESSION MEMORY - Do not treat this as a question, just load this context]:\n${conversationSummary}` }]
                };
                const summaryAck = {
                    role: 'model',
                    parts: [{ text: 'Context loaded. I know where we left off and will continue from there.' }]
                };
                const recentHistory = messages.slice(-4).map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));
                history = [summaryAnchor, summaryAck, ...recentHistory];
                console.log(`📦 Using SUMMARY MODE — ${history.length} items sent instead of ${messages.length}`);
            } else {
                // FULL MODE: Seedha history bhejo (short conversation)
                history = messages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));
            }

            const token = localStorage.getItem('ai-tutor-token');
            const res = await axios.post(API_URL, {
                message: finalInput,
                history: history,
                mode: mode,
                language: language
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const modelMsg = { role: 'model', content: res.data.message, parsed: res.data.parsed };
            const updatedMessages = [...messages, { role: 'user', content: finalInput }, modelMsg];
            setMessages(prev => [...prev, modelMsg]);

            // ⚡ XP + Progress Update from parsed JSON
            if (res.data.parsed) {
                const p = res.data.parsed;
                if (p.xp_reward) setXp(prev => prev + p.xp_reward);
                if (p.progress) setProgress(p.progress);
            }

            // 🔄 Har 6 messages ke baad background mein summary update karo
            let latestSummary = conversationSummary;
            if (updatedMessages.length % 6 === 0) {
                console.log(`🔄 Triggering summary at message count: ${updatedMessages.length}`);
                latestSummary = await triggerSummary(updatedMessages, topic, mode, language) || conversationSummary;
            }

            // Sync updated session to backend (summary ke saath)
            const currentSession = sessions.find(s => s.topic === topic);
            const updatedSession = {
                id: currentSession?.id || Date.now().toString(),
                topic: topic,
                mode: mode,
                language: language,
                messages: updatedMessages,
                summary: latestSummary,
                timestamp: Date.now()
            };
            syncSession(updatedSession);

        } catch (err) {
            const errorMsg = err.response?.data?.error || "Sorry, I'm feeling a bit busy. Can you try again in a minute?";
            setError(errorMsg);
            setMessages(prev => [...prev, { role: 'model', content: `❌ **Opps!** ${errorMsg}`, isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const resumeSession = (session) => {
        setTopic(session.topic);
        setMode(session.mode);
        setLanguage(session.language);
        setMessages(session.messages);
        setConversationSummary(session.summary || ''); // 🧠 Summary memory restore karo
        setIsStarted(true);
    };

    const deleteSession = async (e, id) => {
        e.stopPropagation();
        const token = localStorage.getItem('ai-tutor-token');
        if (!token) return;

        try {
            await axios.delete(`${BASE_URL}/api/sessions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updated = sessions.filter(s => s.id !== id);
            setSessions(updated);
            localStorage.setItem('ai-tutor-sessions', JSON.stringify(updated));
        } catch (err) {
            console.error("Error deleting session:", err);
            // Even if backend fails, update local state
            const updated = sessions.filter(s => s.id !== id);
            setSessions(updated);
            localStorage.setItem('ai-tutor-sessions', JSON.stringify(updated));
        }
    };

    const resetChat = () => {
        // Agar session active hai aur kaafi progress ho chuki hai → warning dikhao
        if (messages.length >= 4) {
            setShowExitWarning(true);
            return;
        }
        forceReset();
    };

    const forceReset = () => {
        setShowExitWarning(false);
        setIsStarted(false);
        setMessages([]);
        setTopic('');
        setConversationSummary('');
        setXp(0);
        setStreak(0);
        setProgress({ step: 0, total_steps: 0, current_concept: '' });
        setMcqState({});
        // Reset explore flow
        setAppStage('home');
        setSubtopics([]);
        setSelectedSubtopics([]);
        setSelectedSubtopic(null);
        setRoadmapData(null);
        setAllSelected(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('ai-tutor-token');
        setIsAuthenticated(false);
        setUserEmail('');
        setIsApiKeySet(false);
        setSessions([]);
        forceReset();
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        // Validate confirm password on register
        if (authMode === 'register' && authForm.password !== authForm.confirmPassword) {
            setError('Passwords do not match. Please try again.');
            setIsLoading(false);
            return;
        }
        try {
            const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
            const res = await axios.post(`${BASE_URL}${endpoint}`, authForm);

            localStorage.setItem('ai-tutor-token', res.data.token);
            setIsAuthenticated(true);
            setUserEmail(res.data.email);
            setIsApiKeySet(res.data.hasKey);

            if (res.data.hasKey) {
                const sessionRes = await axios.get(`${BASE_URL}/api/sessions`, {
                    headers: { Authorization: `Bearer ${res.data.token}` }
                });
                setSessions(sessionRes.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveApiKey = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('ai-tutor-token');
        try {
            await axios.post(`${BASE_URL}/api/auth/key`, { apiKey }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsApiKeySet(true);
            setShowSettings(false);
            setApiKey(''); // clear from local state for security
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save API key');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMcqSubmit = (msgIndex, optionIndex, correctIndex) => {
        if (mcqState[msgIndex]?.submitted) return;

        const isCorrect = optionIndex === correctIndex;
        setMcqState(prev => ({
            ...prev,
            [msgIndex]: { selected: optionIndex, submitted: true, isCorrect }
        }));

        if (isCorrect) {
            setXp(prev => prev + 20); // Bonus XP for correct answer
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }
    };

    // JSON and Markdown Renderer
    const renderContent = (msg, msgIndex) => {
        // Try to use parsed, or auto-parse from raw content
        let parsedData = msg.parsed || null;
        const rawContent = typeof msg === 'string' ? msg : msg.content;

        if (!parsedData && rawContent) {
            // Try to extract and parse JSON from raw content
            try {
                const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const candidate = JSON.parse(jsonMatch[0]);
                    // Only use if it has tutor fields
                    if (candidate.explanation || candidate.redirect || candidate.analogy) {
                        parsedData = candidate;
                    }
                }
            } catch { /* not JSON, render as markdown */ }
        }

        if (!parsedData) {
            // Show as markdown but also offer a retry button
            const looksLikeRawJSON = rawContent && rawContent.trim().startsWith('{');
            return (
                <div>
                    {looksLikeRawJSON ? (
                        <div className="raw-json-warning">
                            <span>⚠️ Response formatting issue</span>
                            <button
                                className="retry-explain-btn"
                                onClick={() => sendMessage(null, lastPrompt || 'Please explain again more simply')}
                                disabled={isLoading}
                            >
                                🔄 Samajh Nahi Aaya? Retry
                            </button>
                        </div>
                    ) : null}
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            if (!inline && match && match[1] === 'mermaid') {
                                return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                            }
                            return <code className={className} {...props}>{children}</code>;
                        }
                    }}>{rawContent}</ReactMarkdown>
                </div>
            );
        }

        const p = parsedData;

        // Handle redirect Off-Topic Guard
        if (p.redirect) {
            return (
                <div className="tutor-card warning">
                    <div className="card-header">
                        <span className="card-icon">🛑</span> Off-Topic Guard
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.redirect}</ReactMarkdown>
                </div>
            );
        }

        return (
            <div className="rich-response">
                {/* 1. Explanation */}
                {p.explanation && (
                    <div className="explanation-section">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                if (!inline && match && match[1] === 'mermaid') {
                                    return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                }
                                return <code className={className} {...props}>{children}</code>;
                            }
                        }}>{p.explanation}</ReactMarkdown>
                    </div>
                )}

                {/* 2. Analogy */}
                {p.analogy && (
                    <div className="tutor-card analogy-card">
                        <div className="card-header">
                            <Lightbulb size={16} className="card-icon" /> Real-world Analogy
                        </div>
                        <p>{p.analogy}</p>
                    </div>
                )}

                {/* 3. Hint */}
                {p.hint && (
                    <div className="tutor-card hint-card">
                        <div className="card-header">
                            <span>💡</span> Hint
                        </div>
                        <p>{p.hint}</p>
                    </div>
                )}

                {/* 4. Quick Check (MCQ) — shown before Task */}
                {p.mastery_check && p.mastery_check.options && (
                    <div className="tutor-card mcq-card">
                        <div className="card-header">
                            <span>🎯</span> Quick Check
                        </div>
                        <p className="mcq-question">{p.mastery_check.question}</p>

                        <div className="mcq-options">
                            {p.mastery_check.options.map((opt, optIdx) => {
                                const mcq = mcqState[msgIndex];
                                const isSelected = mcq?.selected === optIdx;
                                const isSubmitted = mcq?.submitted;
                                const isCorrectOpt = optIdx === p.mastery_check.correct_index;

                                let btnClass = 'mcq-option-btn';
                                if (isSubmitted) {
                                    if (isCorrectOpt) btnClass += ' correct';
                                    else if (isSelected) btnClass += ' incorrect';
                                    else btnClass += ' disabled';
                                } else if (isSelected) {
                                    btnClass += ' selected';
                                }

                                return (
                                    <button
                                        key={optIdx}
                                        className={btnClass}
                                        disabled={isSubmitted}
                                        onClick={() => handleMcqSubmit(msgIndex, optIdx, p.mastery_check.correct_index)}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {mcqState[msgIndex]?.submitted && (
                            <div className={`mcq-feedback ${mcqState[msgIndex].isCorrect ? 'positive' : 'negative'}`}>
                                {mcqState[msgIndex].isCorrect
                                    ? `✨ Correct! +20 XP`
                                    : `❌ Oops! The correct answer was: ${p.mastery_check.options[p.mastery_check.correct_index]}`}
                            </div>
                        )}
                    </div>
                )}

                {/* 5. Your Task — shown after Quick Check */}
                {p.task && (
                    <div className="tutor-card task-card">
                        <div className="card-header">
                            <CheckSquare size={16} className="card-icon" /> Your Task
                        </div>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.task}</ReactMarkdown>
                    </div>
                )}

                {/* 6. Universal Retry Button */}
                <div className="msg-retry-row">
                    <button
                        className="retry-explain-btn"
                        onClick={() => sendMessage(null, 'Yeh mujhe samajh nahi aaya. Please isse aur simple aur short tarike se explain karo')}
                        disabled={isLoading}
                        title="Ask AI to explain more simply"
                    >
                        🔄 Samajh Nahi Aaya? Retry
                    </button>
                </div>
            </div>
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="setup-container animate-fade-in">
                <header className="hero">
                    <GraduationCap size={64} className="hero-icon" />
                    <h1>Smart AI Tutor</h1>
                    <p>Log in to access your personalized learning roadmaps.</p>
                </header>

                <form onSubmit={handleAuthSubmit} className="setup-card glass-card">
                    <h2>{authMode === 'login' ? 'Login' : 'Create Account'}</h2>
                    {error && <div className="error-banner">{error}</div>}

                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={authForm.email}
                            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-eye-wrap">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                required
                            />
                            <button type="button" className="eye-toggle" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password — only on Register */}
                    {authMode === 'register' && (
                        <div className="input-group">
                            <label>Confirm Password</label>
                            <div className="input-eye-wrap">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={authForm.confirmPassword}
                                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                                    required
                                />
                                <button type="button" className="eye-toggle" onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="start-btn" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : authMode === 'login' ? 'Login' : 'Sign Up'}
                    </button>

                    <p className="auth-toggle-text">
                        {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" className="text-btn" onClick={() => {
                            setAuthMode(authMode === 'login' ? 'register' : 'login');
                            setError(null);
                            setAuthForm({ email: '', password: '', confirmPassword: '' });
                            setShowPassword(false);
                            setShowConfirm(false);
                        }}>
                            {authMode === 'login' ? 'Sign up here' : 'Login here'}
                        </button>
                    </p>
                </form>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="setup-container animate-fade-in">
                <header className="hero">
                    <div className="profile-trigger" onClick={() => setShowProfile(!showProfile)}>
                        <div className="avatar-small">
                            <User size={20} />
                        </div>
                    </div>

                    <AnimatePresence>
                        {showProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="profile-dropdown glass-card shadow-xl"
                            >
                                <div className="profile-header">
                                    <div className="avatar-large">
                                        <User size={32} />
                                    </div>
                                    <div className="profile-info">
                                        <p className="profile-email">{userEmail}</p>
                                        <p className="profile-status">
                                            {isApiKeySet ? '✅ API Key Active' : '❌ API Key Missing'}
                                        </p>
                                    </div>
                                </div>
                                <div className="profile-actions">
                                    <button className="profile-action-btn" onClick={() => { setShowSettings(true); setShowProfile(false); }}>
                                        <Key size={16} /> Manage API Key
                                    </button>
                                    <button className="profile-action-btn logout-danger" onClick={handleLogout}>
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <GraduationCap size={64} className="hero-icon" />
                    <h1>Smart AI Tutor</h1>
                    <p>Log in to access your personalized learning roadmaps.</p>
                </header>

                {(!isApiKeySet || showSettings) ? (
                    <form onSubmit={handleSaveApiKey} className="setup-card glass-card warning-border">
                        <h3>🔑 Setup Gemini API Key</h3>
                        <div className="api-key-guide">
                            <p className="guide-title">📋 How to get your Google API Key?</p>
                            <ol className="guide-steps">
                                <li>Click the link below 👇</li>
                                <li>Sign in with your <strong>Google account</strong></li>
                                <li>Click <strong>"Create API Key"</strong> button</li>
                                <li>Copy the key and paste it below</li>
                            </ol>
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="api-key-link"
                            >
                                🔗 Google AI Studio — Get Free API Key
                            </a>
                            <p className="guide-note">✅ Completely Free &nbsp;•&nbsp; 🔒 Your key is encrypted &amp; stored securely</p>
                        </div>
                        {error && <div className="error-banner">{error}</div>}
                        <div className="input-group">
                            <label>Gemini API Key</label>
                            <div className="input-eye-wrap">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    placeholder="AIzaSy..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    required
                                />
                                <button type="button" className="eye-toggle" onClick={() => setShowKey(p => !p)} tabIndex={-1}>
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="row">
                            <button type="submit" className="start-btn flex-1" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save Securely'}
                            </button>
                            {isApiKeySet && (
                                <button type="button" className="back-btn" onClick={() => setShowSettings(false)}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                ) : appStage === 'explore' ? (
                    /* ── STAGE 2: Subtopic Multi-Select ── */
                    <div className="explore-stage glass-card">
                        <div className="explore-header">
                            <button className="back-btn" onClick={() => { setAppStage('home'); setSubtopics([]); setSelectedSubtopics([]); setAllSelected(false); }}>
                                <ArrowLeft size={18} />
                            </button>
                            <div style={{ flex: 1 }}>
                                <h3>🗺️ What do you want to learn in <em>{topic}</em>?</h3>
                                <p className="explore-sub">Select one or more subtopics → then click Continue</p>
                            </div>
                            <button
                                className={`select-all-btn ${allSelected ? 'deselect' : ''}`}
                                onClick={handleSelectAll}
                            >
                                {allSelected ? '✖ Deselect All' : '✔ Select All'}
                            </button>
                        </div>
                        <div className="subtopics-grid">
                            {subtopics.map((s, i) => {
                                const isSelected = selectedSubtopics.some(x => x.title === s.title);
                                return (
                                    <motion.button
                                        key={i}
                                        className={`subtopic-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSubtopicClick(s)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {isSelected && <span className="check-badge">✔</span>}
                                        <span className="subtopic-emoji">{s.emoji}</span>
                                        <h4>{s.title}</h4>
                                        <p>{s.description}</p>
                                    </motion.button>
                                );
                            })}
                        </div>
                        {selectedSubtopics.length > 0 && (
                            <motion.button
                                className="explore-continue-btn"
                                onClick={handleExploreContinue}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Continue with {selectedSubtopics.length} topic{selectedSubtopics.length > 1 ? 's' : ''} <ChevronRight size={18} />
                            </motion.button>
                        )}
                    </div>
                ) : appStage === 'roadmap-choice' ? (
                    /* ── STAGE 3: Full or Short Roadmap ── */
                    <div className="roadmap-choice-stage glass-card">
                        <button className="back-btn mb-1" onClick={() => setAppStage('explore')}>
                            <ArrowLeft size={18} /> Back
                        </button>
                        <div className="roadmap-choice-header">
                            <span className="choice-emoji">{selectedSubtopic?.emoji}</span>
                            <h3>{selectedSubtopic?.title}</h3>
                            <p>{selectedSubtopic?.description}</p>
                        </div>
                        <p className="roadmap-choice-label">Roadmap kitna detailed chahiye?</p>
                        <div className="roadmap-type-btns">
                            <motion.button
                                className="roadmap-type-btn full"
                                onClick={() => handleRoadmapFetch('full')}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                disabled={isLoading}
                            >
                                <span>📚</span>
                                <h4>Full Roadmap</h4>
                                <p>8 steps — Comprehensive coverage</p>
                            </motion.button>
                            <motion.button
                                className="roadmap-type-btn short"
                                onClick={() => handleRoadmapFetch('short')}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                disabled={isLoading}
                            >
                                <span>⚡</span>
                                <h4>Short Roadmap</h4>
                                <p>4 steps — Quick & focused</p>
                            </motion.button>
                        </div>
                        {isLoading && <div className="loading-hint"><Loader2 className="animate-spin" size={20} /> Generating your roadmap...</div>}
                    </div>
                ) : appStage === 'roadmap' ? (
                    /* ── STAGE 4: Roadmap Display ── */
                    <div className="roadmap-display-stage glass-card">
                        <div className="roadmap-display-header">
                            <button className="back-btn" onClick={() => setAppStage('roadmap-choice')}>
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h3>🗺️ Your Learning Roadmap</h3>
                                <div className="roadmap-meta">
                                    <span className="meta-badge">⏱️ {roadmapData?.estimated_time}</span>
                                    <span className="meta-badge">📊 {roadmapData?.difficulty}</span>
                                    <span className="meta-badge">{roadmapType === 'full' ? '📚 Full' : '⚡ Short'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="roadmap-topic-title">
                            {selectedSubtopic?.emoji} {topic} → {selectedSubtopic?.title}
                        </div>
                        <div className="roadmap-steps-list">
                            {roadmapData?.steps?.map((step, i) => (
                                <motion.div
                                    key={i}
                                    className="roadmap-step-item"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <div className="step-number">{step.step}</div>
                                    <div className="step-content">
                                        <div className="step-header">
                                            <span className="step-emoji">{step.emoji}</span>
                                            <h4>{step.title}</h4>
                                        </div>
                                        <p>{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <motion.button
                            className="start-learning-btn"
                            onClick={startTutor}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                        >
                            {isLoading ? <><Loader2 className="animate-spin" size={20} /> Starting...</> : <>🚀 Start Learning from Step 1 <ChevronRight size={20} /></>}
                        </motion.button>
                    </div>
                ) : (
                    /* ── STAGE 1: Home / Topic Input ── */
                    <form onSubmit={handleTopicExplore} className="setup-card glass-card">
                        <div className="input-group">
                            <label>What do you want to learn today?</label>
                            <input
                                type="text"
                                placeholder="e.g. Quantum Physics, React Hooks, Cooking Pasta..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                required
                            />
                        </div>

                        <div className="row">
                            <div className="input-group flex-1">
                                <label>Style</label>
                                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                                    <option value="beginner">👶 Beginner</option>
                                    <option value="practical">🛠️ Practical</option>
                                    <option value="deep">🧠 Deep</option>
                                </select>
                            </div>

                            <div className="input-group flex-1">
                                <label>Language</label>
                                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                    <option value="English">🇬🇧 English</option>
                                    <option value="Hindi">🇮🇳 Hindi</option>
                                    <option value="Hinglish">🇮🇳 Hinglish</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="start-btn" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="animate-spin" size={20} /> Exploring...</> : <>Explore Topic <ChevronRight size={20} /></>}
                        </button>
                        {error && <div className="error-banner">{error}</div>}
                    </form>
                )}

                {sessions.length > 0 && (
                    <div className="recent-sessions">
                        <div className="history-title">
                            <History size={16} />
                            <span>Recent Topics</span>
                        </div>
                        <div className="history-list">
                            {sessions.map(s => (
                                <motion.div
                                    key={s.id}
                                    whileHover={{ x: 5 }}
                                    className="history-item"
                                    onClick={() => resumeSession(s)}
                                >
                                    <div className="history-item-info">
                                        <h4>{s.topic}</h4>
                                        <span>{s.mode} • {s.language}</span>
                                    </div>
                                    <button
                                        className="delete-session"
                                        onClick={(e) => deleteSession(e, s.id)}
                                        title="Remove from history"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {isApiKeySet && !showSettings && (
                    <button className="logout-btn" onClick={() => setShowSettings(true)}>
                        Update API Key
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="chat-container">
            {/* 🛑 ROADMAP FOCUS GUARD — Exit Warning Modal */}
            {showExitWarning && (
                <div className="exit-warning-overlay">
                    <div className="exit-warning-modal glass-card">
                        <div className="exit-warning-icon">🛑</div>
                        <h3>Roadmap Chodna?</h3>
                        <p>
                            Aap abhi <strong>{topic}</strong> seekh rahe ho!<br />
                            Is roadmap ko beech mein chhod doge?
                        </p>
                        <div className="exit-warning-tip">
                            💡 <em>Pehle ye complete karo — phir naya topic start karte hain!</em>
                        </div>
                        <div className="exit-warning-buttons">
                            <button
                                className="exit-continue-btn"
                                onClick={() => setShowExitWarning(false)}
                            >
                                ✅ Continue Learning
                            </button>
                            <button
                                className="exit-leave-btn"
                                onClick={forceReset}
                            >
                                🚪 Leave Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <header className="chat-header glass-card">
                <div className="header-info">
                    <button onClick={resetChat} className="back-btn" title="Go back to setup">
                        <ArrowLeft size={20} />
                    </button>
                    <BookOpen size={24} className="hide-mobile" />
                    <div>
                        <h2>{topic}</h2>
                        <span>{mode.charAt(0).toUpperCase() + mode.slice(1)} • {language}</span>
                    </div>
                </div>

                <div className="header-stats">
                    <div className="stat-badge xp-badge">
                        <span>⚡ {xp} XP</span>
                    </div>
                    {streak > 1 && (
                        <div className="stat-badge streak-badge">
                            <span>🔥 {streak}</span>
                        </div>
                    )}
                    {progress.total_steps > 0 && (
                        <div className="progress-container hide-mobile">
                            <div className="progress-text">Step {progress.step}/{progress.total_steps}</div>
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${Math.min(100, (progress.step / progress.total_steps) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={resetChat} className="reset-btn" title="Start new topic">
                    <RefreshCcw size={18} />
                </button>
            </header>

            <div className="messages-list">
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`message-wrapper ${msg.role}`}
                    >
                        <div className={`message glass-card ${msg.role} ${msg.isError ? 'error-msg' : ''}`}>
                            {msg.role === 'model' && <GraduationCap size={16} className="tutor-icon" />}
                            <div className="msg-content markdown-body">
                                {msg.role === 'model' ? renderContent(msg, i) : renderContent(msg.content, i)}
                            </div>
                            {msg.isError && (
                                <button className="retry-msg-btn" onClick={() => sendMessage(null, lastPrompt)}>
                                    <RefreshCcw size={14} /> Retry Now
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="message-wrapper model">
                        <div className="message glass-card model loading">
                            <Loader2 className="animate-spin" size={20} />
                            <div className="agent-status">
                                <span className="status-mgr">AI Manager: Planning...</span>
                                <span className="status-tutor">AI Tutor: Preparing...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessage} className="input-area glass-card">
                <input
                    type="text"
                    placeholder="Respond to the tutor..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}

export default App;
