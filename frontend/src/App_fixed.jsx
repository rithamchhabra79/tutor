import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, BookOpen, GraduationCap, ChevronRight, Loader2, RefreshCcw, Languages, Lightbulb, CheckSquare, History, Trash2, ArrowLeft, User, Settings, LogOut, Key, Eye, EyeOff, ClipboardList, StickyNote, Download, Sparkles, Menu, X, Clock, LayoutDashboard, Trophy } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'isomorphic-dompurify';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import './App.css';

// 📊 Visual Mode Component (Charts & SVG)
const VisualMode = React.memo(({ content }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const chartHeight = isMobile ? 300 : 400;

    if (!content) return null;
    
    // 1. Handle JSON visualization (e.g. { "type": "pie", "data": [...] })
    try {
        if (content.trim().startsWith('{')) {
            const data = JSON.parse(content);
            const title = data.title || "Visual Data";
            const chartData = data.data || [];

            if (data.type === 'bar') {
                return (
                    <div className="visual-container glass-card mb-4">
                        <div className="visual-header mb-4">
                            <h3>📊 {title}</h3>
                        </div>
                        <div className="chart-wrapper" style={{ width: '100%', height: chartHeight, minHeight: chartHeight, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}
                                        itemStyle={{ color: '#818cf8', fontWeight: 600 }}
                                    />
                                    <Bar dataKey="value" fill="url(#colorBarFixed)" radius={[6, 6, 0, 0]} barSize={isMobile ? 25 : 40}>
                                        <Cell fill="#6366f1" />
                                    </Bar>
                                    <defs>
                                        <linearGradient id="colorBarFixed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0.2}/>
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            }

            if (data.type === 'line') {
                return (
                    <div className="visual-container glass-card mb-4">
                        <div className="visual-header mb-4">
                            <h3>📈 {title}</h3>
                        </div>
                        <div className="chart-wrapper" style={{ width: '100%', height: chartHeight, minHeight: chartHeight, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            }

            if (data.type === 'pie') {
                const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
                return (
                    <div className="visual-container glass-card mb-4">
                        <div className="visual-header mb-4">
                            <h3>📊 {title}</h3>
                        </div>
                        <div className="chart-wrapper" style={{ width: '100%', height: chartHeight, minHeight: chartHeight, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={isMobile ? 40 : 60}
                                        outerRadius={isMobile ? 70 : 100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    {!isMobile && <Legend verticalAlign="bottom" height={36}/>}
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            }

            if (data.type === 'area') {
                return (
                    <div className="visual-container glass-card mb-4">
                        <div className="visual-header mb-4">
                            <h3>🏔️ {title}</h3>
                        </div>
                        <div className="chart-wrapper" style={{ width: '100%', height: chartHeight, minHeight: chartHeight, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValueFixed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorValueFixed)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            }
        }

        if (content.trim().startsWith('<svg')) {
            const cleanSvg = DOMPurify.sanitize(content, {
                USE_PROFILES: { svg: true },
                ADD_TAGS: ["style", "defs", "linearGradient", "stop", "path", "circle", "rect", "text", "tspan"],
                ADD_ATTR: ["transform", "style", "viewBox", "width", "height", "fill", "stroke", "d", "r", "cx", "cy", "x", "y"]
            });
            
            // Robustly scale SVG: Remove existing width/height/style and force 100% width
            let finalSvg = cleanSvg
                .replace(/<svg([^>]*?)\s+width="[^"]*"/gi, '<svg$1')
                .replace(/<svg([^>]*?)\s+height="[^"]*"/gi, '<svg$1')
                .replace(/<svg([^>]*?)\s+style="[^"]*"/gi, '<svg$1');

            if (!finalSvg.includes('viewBox')) {
                // Fallback viewBox if missing (assumes standard 800x400 if not specified)
                finalSvg = finalSvg.replace('<svg', '<svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet"');
            }
            finalSvg = finalSvg.replace('<svg', '<svg width="100%" height="auto" style="max-height: 500px;"');

            return (
                <div className="visual-container glass-card mb-4 svg-wrapper">
                    <div className="visual-header mb-2">
                        <h3>📐 Architecture Diagram</h3>
                    </div>
                    <div className="svg-content" style={{ width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: finalSvg }} />
                </div>
            );
        }
    } catch (e) {
        console.error("Visual Mode Parse Error:", e);
    }
    return <pre className="raw-visual-code"><code>{content}</code></pre>;
});


// 🎓 Course Structure Component (Memoized for performance)
const CourseStructureView = React.memo(({ courseData, topic, onBack, onBookSelect }) => {
    return (
        <div className="course-structure-stage glass-card">
            <div className="course-header mb-6" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>🎓 {topic}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select a book to start learning</p>
                </div>
                {courseData && (
                    <button 
                        className="quick-start-btn glass-card"
                        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => {
                            const sem1 = courseData.semesters[0];
                            if (sem1 && sem1.books && sem1.books[0]) {
                                onBookSelect(sem1.books[0]);
                            }
                        }}
                    >
                        ⚡ Start from Sem 1
                    </button>
                )}
            </div>
            <div className="semesters-list">
                {courseData?.semesters?.map((sem, i) => (
                    <div key={i} className="semester-section mb-6">
                        <h4 className="semester-title">📅 Semester {sem.semester}</h4>
                        <div className="books-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {sem.books?.map((book, bi) => (
                                <motion.button
                                    key={bi}
                                    className="book-card"
                                    onClick={() => onBookSelect(book)}
                                    whileHover={{ y: -5 }}
                                    style={{ display: 'flex', gap: '1rem', padding: '1.25rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                                >
                                    <span style={{ fontSize: '2.5rem' }}>{book.emoji || '📚'}</span>
                                    <div style={{ overflow: 'hidden' }}>
                                        <h5>{book.title}</h5>
                                        <p>{book.description}</p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// 🎓 Course Index Component (Memoized for performance)
const CourseIndexView = React.memo(({ bookIndex, selectedBook, onBack, onStartTopic, isLoading }) => {
    return (
        <div className="course-index-stage glass-card">
            <div className="course-header mb-6" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>📖 {selectedBook?.title}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Choose a topic to begin tutoring</p>
                </div>
                <button 
                    className="start-from-beg-btn glass-card"
                    style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => {
                        const firstCh = bookIndex?.chapters?.[0];
                        const firstTopic = firstCh?.topics?.[0];
                        if (firstCh && firstTopic) {
                            onStartTopic(firstCh, firstTopic);
                        }
                    }}
                    disabled={isLoading}
                >
                    🚀 Start from Chapter 1
                </button>
            </div>
            <div className="chapters-list">
                {bookIndex?.chapters?.map((ch, i) => (
                    <div key={i} className="chapter-item mb-4" style={{ padding: '1.5rem' }}>
                        <div className="chapter-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <span style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold', boxShadow: '0 0 15px var(--primary-glow)' }}>{ch.chapter_number}</span>
                            <h4>{ch.chapter_title}</h4>
                        </div>
                        <div className="topics-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                            {ch.topics?.map((t, ti) => {
                                // Linear Learning Enforcement: Only enable if it's the very first topic, or if there's progress (simplified for now)
                                const isFirstTopicOverall = i === 0 && ti === 0;
                                return (
                                    <button
                                        className="topic-select-btn"
                                        onClick={() => onStartTopic(ch, t)}
                                        disabled={!isFirstTopicOverall && !selectedBook.hasProgress}
                                        style={{ 
                                            padding: '1rem', 
                                            borderRadius: '12px', 
                                            textAlign: 'left', 
                                            fontSize: '0.95rem',
                                            fontWeight: isFirstTopicOverall ? '700' : '500'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ opacity: isFirstTopicOverall ? 1 : 0.5 }}>{isFirstTopicOverall ? '✨' : '🔹'}</span>
                                            <span>{t}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// 📋 Quick Mode Component (Memoized for performance)
const QuickMode = React.memo(({ children }) => {
    return (
        <div className="quick-container glass-card mb-4">
            <div className="visual-header mb-2">
                <h3>📋 Quick Summary</h3>
            </div>
            <div className="quick-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
            </div>
        </div>
    );
});

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/tutor`;

// 🎲 Randomize MCQ Helper
const randomizeMCQ = (p) => {
    if (!p?.mastery_check?.options || !Array.isArray(p.mastery_check.options)) return p;
    const options = p.mastery_check.options;
    const correctAns = options[p.mastery_check.correct_index];
    
    // Create mapping of [value, isCorrect]
    const indexed = options.map((opt, i) => ({ val: opt, isCorrect: i === p.mastery_check.correct_index }));
    
    // Shuffle (Fisher-Yates)
    for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    
    // Update parsed object
    p.mastery_check.options = indexed.map(item => item.val);
    p.mastery_check.correct_index = indexed.findIndex(item => item.isCorrect);
    return p;
};

const UI_MESSAGES = {
    English: {
        quota: "ðŸš« Daily AI Quota reached. Please try again tomorrow or check your API Key.",
        busy: "âš ï¸ AI is busy. Please retry in 5 seconds.",
        generic_error: "Fail to load. Please try again.",
        mcq_missing: "Please select an MCQ answer first!",
        task_missing: "Please write your Task answer first!",
        roadmap_error: "Roadmap not generated. Try again.",
        subtopic_error: "AI failed to generate subtopics. Try again."
    },
    Hindi: {
        quota: "ðŸš« à¤¦à¥ˆà¤¨à¤¿à¤• AI à¤•à¥‹à¤Ÿà¤¾ à¤¸à¤®à¤¾à¤ªà¥à¤¤ à¤¹à¥‹ à¤—à¤¯à¤¾ à¤¹à¥ˆà¥¤ à¤•à¥ƒà¤ªà¤¯à¤¾ à¤•à¤² à¤ªà¥à¤¨à¤ƒ à¤ªà¥à¤°à¤¯à¤¾à¤¸ à¤•à¤°à¥‡à¤‚ à¤¯à¤¾ à¤…à¤ªà¤¨à¥€ API Key à¤œà¤¾à¤‚à¤šà¥‡à¤‚à¥¤",
        busy: "âš ï¸ AI à¤µà¥à¤¯à¤¸à¥à¤¤ à¤¹à¥ˆà¥¤ à¤•à¥ƒà¤ªà¤¯à¤¾ 5 à¤¸à¥‡à¤•à¤‚à¤¡ à¤®à¥‡à¤‚ à¤ªà¥à¤¨à¤ƒ à¤ªà¥à¤°à¤¯à¤¾à¤¸ à¤•à¤°à¥‡à¤‚à¥¤",
        generic_error: "à¤²à¥‹à¤¡ à¤•à¤°à¤¨à¥‡ à¤®à¥‡à¤‚ à¤µà¤¿à¤«à¤²à¥¤ à¤•à¥ƒà¤ªà¤¯à¤¾ à¤ªà¥à¤¨: à¤ªà¥à¤°à¤¯à¤¾à¤¸ à¤•à¤°à¥‡à¤‚à¥¤",
        mcq_missing: "à¤•à¥ƒà¤ªà¤¯à¤¾ à¤ªà¤¹à¤²à¥‡ MCQ à¤‰à¤¤à¥à¤¤à¤° à¤šà¥à¤¨à¥‡à¤‚!",
        task_missing: "à¤•à¥ƒà¤ªà¤¯à¤¾ à¤ªà¤¹à¤²à¥‡ à¤…à¤ªà¤¨à¤¾ à¤Ÿà¤¾à¤¸à¥à¤• à¤‰à¤¤à¥à¤¤à¤° à¤²à¤¿à¤–à¥‡à¤‚!",
        roadmap_error: "à¤°à¥‹à¤¡à¤®à¥ˆà¤ª à¤œà¤¨à¤°à¥‡à¤Ÿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥à¤†à¥¤ à¤«à¤¿à¤° à¤¸à¥‡ à¤ªà¥à¤°à¤¯à¤¾à¤¸ à¤•à¤°à¥‡à¤‚à¥¤",
        subtopic_error: "AI à¤¸à¤¬à¤Ÿà¥‰à¤ªà¤¿à¤• à¤œà¤¨à¤°à¥‡à¤Ÿ à¤¨à¤¹à¥€à¤‚ à¤•à¤° à¤ªà¤¾à¤¯à¤¾à¥¤ à¤«à¤¿à¤° à¤¸à¥‡ à¤ªà¥à¤°à¤¯à¤¾à¤¸ à¤•à¤°à¥‡à¤‚à¥¤"
    },
    Hinglish: {
        quota: "ðŸš« Daily AI Quota reach ho gaya hai. Kal try karein ya apni API Key check karein.",
        busy: "âš ï¸ AI abhi busy hai. 5 seconds baad retry karo.",
        generic_error: "Load nahi ho paya. Please try again.",
        mcq_missing: "Pehle MCQ ka answer select karo!",
        task_missing: "Pehle Task ka answer likho!",
        roadmap_error: "Roadmap generate nahi hua. Dobara try karo.",
        subtopic_error: "AI ne subtopics generate nahi kiye. Dobara try karo."
    }
};


const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" /><polyline points="15 3 15 9 21 9" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ðŸ“‹ SidebarContent â€” wrapped in React.memo so it ONLY re-renders
// when sidebar-specific props change (notes, tab). NOT on typing.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SidebarContent = React.memo(function SidebarContent({
    activeSidebarTab,
    setActiveSidebarTab,
    roadmapData,
    progress,
    autoNotes,
    manualNotes,
    setManualNotes,
    handleDownloadAINotes,
    handleDownloadManualNotes,
    handleGenerateNotes,
    isGeneratingNotes,
    isDesktop,
    onClose,
    onLogout,
    onReset
}) {
    // Local state for 'Saved' feedback
    const [justSaved, setJustSaved] = React.useState(false);

    const handleManualSave = () => {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
    };

    return (
        <>
            <div className="sidebar-header">
                <div className="sidebar-tabs">
                    {['track', 'notes', 'menu'].map((tab) => (
                        <button
                            key={tab}
                            className={`sidebar-tab ${activeSidebarTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveSidebarTab(tab)}
                        >
                            {activeSidebarTab === tab && (
                                <motion.div
                                    layoutId="active-tab-bg"
                                    className="active-tab-indicator"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className="tab-content-inner">
                                {tab === 'track' ? <BookOpenIcon /> : tab === 'notes' ? <NoteIcon /> : <MenuIcon />}
                                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                            </div>
                        </button>
                    ))}
                </div>
                {!isDesktop && (
                    <button className="close-sidebar-btn" onClick={onClose} title="Close Sidebar">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="sidebar-scroll-area">
                {activeSidebarTab === 'track' ? (
                    <div className="track-list">
                        {roadmapData?.steps?.map((step, idx) => {
                            const stepNum = idx + 1;
                            const isCompleted = progress.step > stepNum;
                            const isCurrent = progress.step === stepNum;
                            return (
                                <div key={idx} className={`track-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                                    <div className="track-dot">{isCompleted ? '✔' : stepNum}</div>
                                    <div className="track-content">
                                        <h5>{step.title}</h5>
                                        <p>{isCurrent ? 'Ongoing...' : isCompleted ? 'Completed' : 'Upcoming'}</p>
                                    </div>
                                </div>
                            );
                        }) || <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>No roadmap active</p>}
                    </div>
                ) : activeSidebarTab === 'notes' ? (
                    <div className="notes-panel">
                        <div className="notes-section">
                            <div className="notes-header">
                                <div className="section-label">âœ¨ AI Auto-Notes</div>
                                <div className="header-actions">
                                    <button
                                        className="icon-btn-text"
                                        onClick={handleGenerateNotes}
                                        disabled={isGeneratingNotes}
                                        title="Generate/Update Study Guide"
                                    >
                                        {isGeneratingNotes ? <Loader2 size={14} className="animate-spin" /> : 'âœ¨ Gen Guide'}
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={handleDownloadAINotes}
                                        disabled={!autoNotes}
                                        title="Download AI Notes"
                                    >
                                        <Download size={14} />
                                    </button>
                                </div>
                            </div>
                            {autoNotes ? (
                                <div className="auto-notes-display glass-card">{autoNotes}</div>
                            ) : (
                                <div className="empty-notes glass-card">
                                    <p>AI automatically saves study notes here as you chat...</p>
                                </div>
                            )}
                        </div>

                        <div className="notes-section">
                            <div className="notes-header">
                                <div className="section-label">ðŸ“‹ Personal Notes</div>
                                <div className="header-actions">
                                    <button
                                        className={`icon-btn-text ${justSaved ? 'saved' : ''}`}
                                        onClick={handleManualSave}
                                        title="Save Note"
                                    >
                                        {justSaved ? 'Saved! âœ…' : 'ðŸ’¾ Save'}
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={handleDownloadManualNotes}
                                        disabled={!manualNotes}
                                        title="Download Personal Notes"
                                    >
                                        <Download size={14} />
                                    </button>
                                </div>
                            </div>
                            <textarea
                                className="manual-notes-area glass-card"
                                placeholder="Apne points yahan likhein..."
                                value={manualNotes}
                                onChange={(e) => setManualNotes(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="menu-panel">
                        <button className="menu-item" onClick={onReset}>
                            <RefreshCcw size={18} />
                            <div className="menu-text">
                                <span>Home (Setup)</span>
                                <small>Naya topic start karo</small>
                            </div>
                        </button>
                        <button className="menu-item logout-danger" onClick={onLogout}>
                            <LogOut size={18} />
                            <div className="menu-text">
                                <span>Logout</span>
                                <small>Sign out of your account</small>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}); // end React.memo

// Icons defined above

function App() {
    const [topic, setTopic] = useState('');
    const [mode, setMode] = useState('beginner');
    const [language, setLanguage] = useState('English');

    // Auth States
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [showProfile, setShowProfile] = useState(false);
    const [authForm, setAuthForm] = useState({ name: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });

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
    // âš¡ XP + Progress (Feature 3)
    const [xp, setXp] = useState(0);
    const [streak, setStreak] = useState(0);
    
    // 🎓 Full Course States
    const [courseData, setCourseData] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [bookIndex, setBookIndex] = useState(null);
    const [progress, setProgress] = useState({ step: 0, total_steps: 0, current_concept: '' });
    // ðŸ¤” MCQ State (Feature 2 - Socratic)
    const [mcqState, setMcqState] = useState({}); // { [msgIndex]: { selected, submitted } }

    // ðŸ—ºï¸ EXPLORE FLOW STATE
    const [appStage, setAppStage] = useState('home');
    const [subtopics, setSubtopics] = useState([]);
    const [selectedSubtopics, setSelectedSubtopics] = useState([]);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [roadmapData, setRoadmapData] = useState(null);
    const [roadmapType, setRoadmapType] = useState('full');
    const [allSelected, setAllSelected] = useState(false);
    const [showTrackSidebar, setShowTrackSidebar] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState('track');
    const [autoNotes, setAutoNotes] = useState(() => localStorage.getItem('ai-tutor-auto-notes') || '');
    const [manualNotes, setManualNotes] = useState(() => localStorage.getItem('ai-tutor-personal-notes') || '');
    const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
    const [cooldown, setCooldown] = useState(0); // â±ï¸ Cooldown state

    // Stable callbacks for SidebarContent
    const stableSetManualNotes = React.useCallback((val) => setManualNotes(val), []);
    const stableSetActiveSidebarTab = React.useCallback((tab) => setActiveSidebarTab(tab), []);
    const stableCloseSidebar = React.useCallback(() => setShowTrackSidebar(false), []);
    // ðŸ‘ï¸ Show/hide toggles
    const [showKey, setShowKey] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDesktop, setIsDesktop] = window && window.innerWidth ? useState(window.innerWidth >= 1100) : useState(true);

    const chatEndRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1100);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);



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

    // ðŸ§  ROLLING SUMMARY MEMORY
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
            console.log('ðŸ§  Summary Memory Updated:\n', newSummary);
            return newSummary;
        } catch (e) {
            console.warn('Summary generation failed (non-critical):', e.message);
            return null;
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ðŸ”’ Chat Mode: lock page scroll when inside chat
    useEffect(() => {
        if (isStarted) {
            document.body.classList.add('chat-mode');
        } else {
            document.body.classList.remove('chat-mode');
        }
        return () => document.body.classList.remove('chat-mode');
    }, [isStarted]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // â±ï¸ Cooldown Timer Effect
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // Step 1: Topic submit â†’ fetch subtopics
    const handleTopicExplore = async (e) => {
        e.preventDefault();
        if (!topic.trim() || !isApiKeySet || isLoading || cooldown > 0) return;
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
            setCooldown(20); // â±ï¸ Set 20s cooldown
        } catch (err) {
            const msg = err.response?.data?.error || '';
            const msgs = UI_MESSAGES[language] || UI_MESSAGES.English;

            if (err.response?.status === 429 || msg.includes('limit') || msg.includes('quota')) {
                setError(msgs.quota);
            } else if (err.response?.status === 503 || msg.includes('busy')) {
                setError(msgs.busy);
            } else {
                setError(msgs.subtopic_error);
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

    // Step 3: Roadmap type chosen â†’ fetch roadmap
    const handleRoadmapFetch = async (type) => {
        if (isLoading || cooldown > 0) return;
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
            setCooldown(20); // â±ï¸ Set 20s cooldown
        } catch (err) {
            const msg = err.response?.data?.error || '';
            const msgs = UI_MESSAGES[language] || UI_MESSAGES.English;

            if (err.response?.status === 429 || msg.includes('limit') || msg.includes('quota')) {
                setError(msgs.quota);
            } else if (err.response?.status === 503 || msg.includes('busy')) {
                setError(msgs.busy);
            } else {
                setError(msgs.roadmap_error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 🎓 Step 3.1: Fetch Course Structure
    const handleCourseFetch = async () => {
        if (isLoading || cooldown > 0) return;
        setRoadmapType('course');
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('ai-tutor-token');
        try {
            const res = await axios.post(`${BASE_URL}/api/course/structure`, {
                topic,
                language
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourseData(res.data);
            setAppStage('course-structure');
            setCooldown(20);
        } catch (err) {
            setError("Course structure load karne mein problem hui.");
        } finally {
            setIsLoading(false);
        }
    };

    // 🎓 Step 3.2: Fetch Book Index
    const handleBookSelect = async (book) => {
        if (isLoading) return;
        // Enforce linear start: For now, assume a new book has no progress.
        // In a real app, you'd load progress from user data.
        setSelectedBook({ ...book, hasProgress: false }); 
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('ai-tutor-token');
        try {
            const res = await axios.post(`${BASE_URL}/api/course/book-index`, {
                bookTitle: book.title,
                topic,
                language
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookIndex(res.data);
            setAppStage('course-index');
        } catch (err) {
            setError("Book index load karne mein problem hui.");
        } finally {
            setIsLoading(false);
        }
    };

    // 🎓 Step 3.3: Start Tutor for Topic
    const startCourseTopic = async (chapter, topicName) => {
        setTopic(`${topic} - ${topicName}`);
        setIsStarted(true);
        setIsLoading(true);
        setAppStage('learning');
        const token = localStorage.getItem('ai-tutor-token');
        const context = `Starting a Full Course topic. This is Chapter ${chapter.chapter_number}: "${chapter.chapter_title}". The specific topic is "${topicName}". (Part of the book: "${selectedBook.title}" - ${topic})`;
        
        try {
            const res = await axios.post(API_URL, {
                message: `${context} Let's begin teaching.`,
                mode,
                language,
                history: []
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            const modelMsgParsed = res.data.parsed ? randomizeMCQ({ ...res.data.parsed }) : null;
            const history = [
                { role: 'user', content: `Teach me about ${topicName}` },
                { role: 'model', content: res.data.message, parsed: modelMsgParsed }
            ];
            setMessages(history);
            setProgress({ step: 1, total_steps: 1, current_concept: topicName });
            
            const newSession = {
                id: Date.now().toString(),
                topic: topicName,
                mode, language, messages: history, timestamp: Date.now()
            };
            syncSession(newSession);
        } catch (err) {
            setError("Topic start karne mein problem hui.");
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
            const modelMsgParsed = res.data.parsed ? randomizeMCQ({ ...res.data.parsed }) : null;
            const initialModelMsg = { role: 'model', content: res.data.message, parsed: modelMsgParsed };
            const initialHistory = [initialUserMsg, initialModelMsg];

            setMessages(initialHistory);
            setTopic(learningTopic);

            const initialProgress = {
                step: 1,
                total_steps: roadmapData?.steps?.length || 0,
                current_concept: roadmapData?.steps?.[0]?.title || ''
            };
            setProgress(initialProgress);
            setXp(0);
            setStreak(0);

            const note = res.data.parsed?.study_note || '';
            if (note) setAutoNotes('- ' + note);

            // Sync new session
            const newSession = {
                id: Date.now().toString(),
                topic: learningTopic,
                mode: mode,
                language: language,
                messages: initialHistory,
                summary: '',
                progress: initialProgress,
                xp: xp,
                streak: streak,
                roadmapData: roadmapData, // ðŸ—ºï¸ Save roadmap for persistence
                autoNotes: '',
                manualNotes: '',
                timestamp: Date.now()
            };
            syncSession(newSession);
        } catch (err) {
            setMessages([{ role: 'model', content: 'âŒ Error connecting to the tutor. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (e, retryInput = null) => {
        if (e) e.preventDefault();
        const finalInput = retryInput || input;
        if (!finalInput.trim() || isLoading || (cooldown > 0 && !retryInput)) return;

        setError(null); // Clear previous errors
        setLastPrompt(finalInput); // Save for retry

        setIsLoading(true);

        // --- MCQ & Task Combined Logic ---
        let finalMessageToSend = finalInput;
        const lastMsg = messages[messages.length - 1];

        // ðŸ§ª ONLY validate if this is NOT an action button retry
        const isMcqTurn = !retryInput && lastMsg?.role === 'model' && lastMsg.parsed?.mastery_check?.options?.length > 0;
        if (isMcqTurn) {
            const msgIndex = messages.length - 1;
            const mcq = mcqState[msgIndex];
            const msgs = UI_MESSAGES[language] || UI_MESSAGES.English;

            if (!mcq?.submitted) {
                setError(msgs.mcq_missing);
                setIsLoading(false);
                return;
            }

            if (!finalInput.trim()) {
                setError(msgs.task_missing);
                setIsLoading(false);
                return;
            }

            const p = lastMsg.parsed;
            const selectedOptText = p.mastery_check.options[mcq.selected];
            const isCorrect = mcq.isCorrect;

            finalMessageToSend = `[STUDENT SUBMISSION]
MCQ Answer: ${selectedOptText} (${isCorrect ? 'Correct' : 'Incorrect'})
Task Answer: ${finalInput}`;
        }

        // Add user message to UI (plain version)
        if (!retryInput) {
            const userMsg = { role: 'user', content: finalInput };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
        }

        try {
            // ============================================================
            // ðŸ§  SUMMARY MEMORY â€” Smart History Builder
            // Agar summary hai â†’ summary + last 4 msgs bhejo (max ~500 tokens)
            // Agar summary nahi â†’ puri history (first 6 msgs tak hi hogi)
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
                console.log(`ðŸ“¦ Using SUMMARY MODE â€” ${history.length} items sent instead of ${messages.length}`);
            } else {
                // FULL MODE: Seedha history bhejo (short conversation)
                history = messages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));
            }

            const token = localStorage.getItem('ai-tutor-token');
            const res = await axios.post(API_URL, {
                message: finalMessageToSend,
                history: history,
                mode: mode,
                language: language
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const modelMsgParsed = res.data.parsed ? randomizeMCQ({ ...res.data.parsed }) : null;
            const modelMsg = { role: 'model', content: res.data.message, parsed: modelMsgParsed };
            const updatedMessages = [...messages, { role: 'user', content: finalInput }, modelMsg];
            setMessages(prev => [...prev, modelMsg]);

            // âš¡ XP + Progress Update from parsed JSON
            if (res.data.parsed) {
                const p = res.data.parsed;
                if (p.xp_reward) setXp(prev => prev + p.xp_reward);
                if (p.progress) setProgress(p.progress);
            }

            // ðŸ”„ Har 6 messages ke baad background mein summary update karo
            let latestSummary = conversationSummary;
            if (updatedMessages.length % 6 === 0) {
                console.log(`ðŸ”„ Triggering summary at message count: ${updatedMessages.length}`);
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
                progress: progress,
                xp: xp,
                streak: streak,
                roadmapData: roadmapData, // ðŸ—ºï¸ Keep roadmap in sync
                autoNotes: '',
                manualNotes: '',
                timestamp: Date.now()
            };
            syncSession(updatedSession);
            setCooldown(20); // â±ï¸ Set 20s cooldown (only on success)

        } catch (err) {
            const msg = err.response?.data?.error || "";
            const msgs = UI_MESSAGES[language] || UI_MESSAGES.English;
            let errorMsg = msgs.generic_error;

            if (err.response?.status === 429 || msg.includes('limit') || msg.includes('quota')) {
                errorMsg = msgs.quota;
            } else if (msg) {
                errorMsg = msg;
            }

            setError(errorMsg);
            setMessages(prev => [...prev, { role: 'model', content: `âŒ **Opps!** ${errorMsg}`, isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const resumeSession = (session) => {
        setTopic(session.topic);
        setMode(session.mode);
        setLanguage(session.language);
        setMessages(session.messages);
        setConversationSummary(session.summary || '');
        setRoadmapData(session.roadmapData || null); // ðŸ—ºï¸ Restore roadmap
        setProgress(session.progress || { step: 0, total_steps: 0, current_concept: '' });
        setXp(session.xp || 0);
        setStreak(session.streak || 0);
        setAutoNotes(session.autoNotes || '');
        setManualNotes(session.manualNotes || '');
        setIsStarted(true);
        setAppStage('learning'); // Ensure stage is correct
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
        // Agar session active hai aur kaafi progress ho chuki hai â†’ warning dikhao
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
        setError(null); // Clear errors on reset
        // Reset explore flow
        setAppStage('home');
        setSubtopics([]);
        setSelectedSubtopics([]);
        setSelectedSubtopic(null);
        setRoadmapData(null);
        setAllSelected(false);
        setCourseData(null);
        setSelectedBook(null);
        setBookIndex(null);
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

        // Validate fields for register
        if (authMode === 'register') {
            if (!authForm.name || !authForm.email || !authForm.phoneNumber || !authForm.password) {
                setError('All fields are required');
                setIsLoading(false);
                return;
            }
            if (authForm.password !== authForm.confirmPassword) {
                setError('Passwords do not match');
                setIsLoading(false);
                return;
            }
        } else {
            // Validate login
            if (!authForm.email || !authForm.password) {
                setError('Identifier and password are required');
                setIsLoading(false);
                return;
            }
        }

        try {
            const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
            const payload = authMode === 'login'
                ? { identifier: authForm.email, password: authForm.password }
                : {
                    name: authForm.name,
                    email: authForm.email,
                    phoneNumber: authForm.phoneNumber,
                    password: authForm.password
                };

            const res = await axios.post(`${BASE_URL}${endpoint}`, payload);

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

    const handleMcqSubmit = (msgIndex, optionIndex, correctIndex, optionText) => {
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

        // ðŸ¤– Just update state, don't auto-send anymore
        const feedback = `[MCQ] I chose "${optionText}". (Result: ${isCorrect ? 'Correct' : 'Incorrect'})`;
        console.log("MCQ Selection:", feedback);
        setError(null); // Clear error after selection
    };

    const handleGenerateNotes = async () => {
        const token = localStorage.getItem('ai-tutor-token');
        if (!token) return;

        setIsGeneratingNotes(true);
        try {
            const res = await axios.post(`${BASE_URL}/api/notes/generate`, {
                history: messages,
                topic: topic,
                language: language
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.notes) {
                // ðŸ“ Prepend/Append based on user preference - here we append with a separator
                const separator = "\n\n---\n\n";
                const newNotes = autoNotes ? autoNotes + separator + res.data.notes : res.data.notes;
                setAutoNotes(newNotes);
                setActiveSidebarTab('notes');
            }
        } catch (err) {
            console.error("Notes Error:", err);
            setError(language === 'English' ? "Failed to generate notes." : "Notes banane mein problem hui.");
        } finally {
            setIsGeneratingNotes(false);
        }
    };

    const downloadNotesAsPDF = (title, content) => {
        const printWindow = window.open('', '_blank');
        const html = `
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; background: #fff; }
                    h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; font-size: 2.2rem; margin-bottom: 25px; }
                    .notes-content { white-space: pre-wrap; background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 1.1rem; }
                    footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 20px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="notes-content">${content || 'No content found.'}</div>
                <footer>Generated on ${new Date().toLocaleDateString()}</footer>
                <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); };</script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleDownloadAINotes = () => downloadNotesAsPDF(`AI Study Guide - ${topic}`, autoNotes);
    const handleDownloadManualNotes = () => downloadNotesAsPDF(`My Personal Notes - ${topic}`, manualNotes);

    const handleDownloadPDF = () => {
        const printWindow = window.open('', '_blank');
        const content = `
            <html>
            <head>
                <title>Study Notes - ${topic}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; background: #fff; }
                    h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; font-size: 2.5rem; }
                    h2 { color: #334155; margin-top: 40px; border-left: 5px solid #4f46e5; padding-left: 15px; font-size: 1.5rem; }
                    .section { margin-bottom: 40px; }
                    .notes-content { white-space: pre-wrap; background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 1.1rem; }
                    .highlight { background: #fef08a; padding: 0 4px; border-radius: 4px; font-weight: 600; }
                    footer { margin-top: 60px; text-align: center; color: #64748b; font-size: 0.9rem; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>Study Notes: ${topic}</h1>
                
                <div class="section">
                    <h2>ðŸ“š AI Generated Insights</h2>
                    <div class="notes-content">${autoNotes || 'No AI notes generated yet.'}</div>
                </div>

                <div class="section">
                    <h2>ðŸ“ Student Contributions</h2>
                    <div class="notes-content">${manualNotes || 'No manual notes added.'}</div>
                </div>

                <footer>Generated by Smart AI Tutor on ${new Date().toLocaleDateString()}</footer>
                
                <script>
                    window.onload = () => { setTimeout(() => { window.print(); }, 500); };
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
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
                            <span>âš ï¸ Response formatting issue</span>
                            <button
                                className="retry-explain-btn"
                                onClick={() => sendMessage(null, lastPrompt || 'Please explain again more simply')}
                                disabled={isLoading}
                            >
                                ðŸ”„ Samajh Nahi Aaya? Retry
                            </button>
                        </div>
                    ) : null}
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const lang = match ? match[1] : '';
                            const content = String(children).replace(/\n$/, '');
                            if (!inline) {
                                if (lang === 'visual') return <VisualMode content={content} />;
                                if (lang === 'quick') return <QuickMode>{content}</QuickMode>;
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
                        <span className="card-icon">ðŸ›‘</span> Off-Topic Guard
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
                                const lang = match ? match[1] : '';
                                const content = String(children).replace(/\n$/, '');
                                if (!inline) {
                                    if (lang === 'visual') return <VisualMode content={content} />;
                                    if (lang === 'quick') return <QuickMode>{content}</QuickMode>;
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
                            <span>ðŸ’¡</span> Hint
                        </div>
                        <p>{p.hint}</p>
                    </div>
                )}

                {/* 4. Quick Check (MCQ) â€” shown before Task */}
                {p.mastery_check && p.mastery_check.options && (
                    <div className="tutor-card mcq-card">
                        <div className="card-header">
                            <span>ðŸŽ¯</span> Quick Check
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
                                        onClick={() => handleMcqSubmit(msgIndex, optIdx, p.mastery_check.correct_index, opt)}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {mcqState[msgIndex]?.submitted && (
                            <div className={`mcq-feedback ${mcqState[msgIndex].isCorrect ? 'positive' : 'negative'}`}>
                                {mcqState[msgIndex].isCorrect
                                    ? `âœ¨ Correct! +20 XP`
                                    : `âŒ Oops! The correct answer was: ${p.mastery_check.options[p.mastery_check.correct_index]}`}
                            </div>
                        )}
                    </div>
                )}

                {/* 5. Your Task â€” shown after Quick Check */}
                {p.task && (
                    <div className="tutor-card task-card">
                        <div className="card-header">
                            <CheckSquare size={16} className="card-icon" /> Your Task
                        </div>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const lang = match ? match[1] : '';
                                    if (!inline && lang === 'quick') return <QuickMode>{String(children)}</QuickMode>;
                                    return <code className={className} {...props}>{children}</code>;
                                }
                            }}
                        >{p.task}</ReactMarkdown>
                    </div>
                )}

                {/* 6. Universal Action Buttons (Deep Dive & Retry) */}
                <div className="msg-action-row">
                    <button
                        className="deep-dive-btn"
                        onClick={() => sendMessage(null, language === 'English' ? 'Explain this in great detail with more examples.' : 'Iske baare mein bohot vistaar se samjhao (Explain in Detail)')}
                        disabled={isLoading || cooldown > 0}
                        title="Get an in-depth explanation"
                    >
                        {cooldown > 0 ? `Wait ${cooldown}s` : <>ðŸ”¬ {language === 'English' ? 'Deep Dive' : 'Explain in Detail'}</>}
                    </button>
                    <button
                        className="retry-explain-btn"
                        onClick={() => sendMessage(null, 'Yeh mujhe samajh nahi aaya. Please isse aur simple aur short tarike se explain karo')}
                        disabled={isLoading || cooldown > 0}
                        title="Ask AI to explain more simply"
                    >
                        {cooldown > 0 ? `${cooldown}s` : 'ðŸ”„ Retry'}
                    </button>
                </div>
            </div>
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="App">
                <div className="setup-container animate-fade-in">
                    <header className="hero">
                        <GraduationCap size={64} className="hero-icon" />
                        <h1>Smart AI Tutor</h1>
                        <p>Log in to access your personalized learning roadmaps.</p>
                    </header>
                    <form onSubmit={handleAuthSubmit} className="setup-card glass-card">
                        <h2>{authMode === 'login' ? 'Login' : 'Create Account'}</h2>
                        {error && <div className="error-banner">{error}</div>}
                        {authMode === 'register' && (
                            <div className="input-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={authForm.name}
                                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        <div className="input-group">
                            <label>{authMode === 'login' ? 'Email or Phone Number' : 'Email'}</label>
                            <input
                                type={authMode === 'login' ? 'text' : 'email'}
                                placeholder={authMode === 'login' ? 'you@example.com or 9876543210' : 'you@example.com'}
                                value={authForm.email}
                                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                required
                            />
                        </div>
                        {authMode === 'register' && (
                            <div className="input-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="9876543210"
                                    value={authForm.phoneNumber}
                                    onChange={(e) => setAuthForm({ ...authForm, phoneNumber: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-eye-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                    value={authForm.password}
                                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                    required
                                />
                                <button type="button" className="eye-toggle" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        {authMode === 'register' && (
                            <div className="input-group">
                                <label>Confirm Password</label>
                                <div className="input-eye-wrap">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
                                setAuthForm({ name: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });
                                setShowPassword(false);
                                setShowConfirm(false);
                            }}>
                                {authMode === 'login' ? 'Sign up here' : 'Login here'}
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="App">
                <div className="setup-container animate-fade-in">
                    <header className="hero">
                        <div className="profile-trigger" onClick={() => setShowProfile(!showProfile)}>
                            <div className="avatar-small">
                                <User size={20} />
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {showProfile && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    style={{ willChange: 'transform, opacity' }}
                                    className="profile-dropdown glass-card shadow-xl"
                                >
                                    <div className="profile-header">
                                        <div className="avatar-large">
                                            <User size={32} />
                                        </div>
                                        <div className="profile-info">
                                            <p className="profile-email">{userEmail}</p>
                                            <p className="profile-status">
                                                {isApiKeySet ? 'âœ… API Key Active' : 'âŒ API Key Missing'}
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
                            <h3>ðŸ”‘ Setup Gemini API Key</h3>
                            <div className="api-key-guide">
                                <p className="guide-title">ðŸ“‹ How to get your Google API Key?</p>
                                <ol className="guide-steps">
                                    <li>Click the link below ðŸ‘‡</li>
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
                                    ðŸ”— Google AI Studio â€” Get Free API Key
                                </a>
                                <p className="guide-note">âœ… Completely Free &nbsp;â€¢&nbsp; ðŸ”’ Your key is encrypted &amp; stored securely</p>
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
                        /* â”€â”€ STAGE 2: Subtopic Multi-Select â”€â”€ */
                        <div className="explore-stage glass-card">
                            <div className="explore-header">
                                <button className="back-btn" onClick={() => { setAppStage('home'); setSubtopics([]); setSelectedSubtopics([]); setAllSelected(false); }}>
                                    <ArrowLeft size={18} />
                                </button>
                                <div style={{ flex: 1 }}>
                                    <h3>ðŸ—ºï¸ What do you want to learn in <em>{topic}</em>?</h3>
                                    <p className="explore-sub">Select one or more subtopics â†’ then click Continue</p>
                                </div>
                                <button
                                    className={`select-all-btn ${allSelected ? 'deselect' : ''}`}
                                    onClick={handleSelectAll}
                                >
                                    {allSelected ? 'âœ– Deselect All' : 'âœ” Select All'}
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
                                            {isSelected && <span className="check-badge">âœ”</span>}
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
                        /* â”€â”€ STAGE 3: Full or Short Roadmap â”€â”€ */
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
                                    className="roadmap-type-btn short"
                                    onClick={() => handleRoadmapFetch('short')}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    disabled={isLoading || cooldown > 0}
                                >
                                    <span>âš¡</span>
                                    <h4>Short</h4>
                                    <p>10 steps â€” Quick Start</p>
                                </motion.button>
                                <motion.button
                                    className="roadmap-type-btn full"
                                    onClick={() => handleRoadmapFetch('full')}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    disabled={isLoading || cooldown > 0}
                                >
                                    <span>ðŸ“š</span>
                                    <h4>Full</h4>
                                    <p>20 steps â€” Deep Dive</p>
                                </motion.button>
                                <motion.button
                                    className="roadmap-type-btn master"
                                    onClick={() => handleRoadmapFetch('master')}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    disabled={isLoading || cooldown > 0}
                                >
                                    <span>ðŸ†</span>
                                    <h4>Master</h4>
                                    <p>50 steps â€” Pro Track</p>
                                </motion.button>
                                <motion.button
                                    className="roadmap-type-btn advance"
                                    onClick={() => handleRoadmapFetch('advance')}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    disabled={isLoading || cooldown > 0}
                                >
                                    <span>ðŸš€</span>
                                    <h4>Advance</h4>
                                    <p>100 steps â€” Ultimate</p>
                                </motion.button>
                                <motion.button
                                    className="roadmap-type-btn full-course"
                                    onClick={handleCourseFetch}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    disabled={isLoading || cooldown > 0}
                                >
                                    <span>ðŸŽ“</span>
                                    <h4>Full Course</h4>
                                    <p>Semesters & Books</p>
                                </motion.button>
                            </div>
                            {isLoading && <div className="loading-hint"><Loader2 className="animate-spin" size={20} /> Generating your roadmap...</div>}
                            {cooldown > 0 && <div className="loading-hint cooldown">â³ Please wait {cooldown}s before next request...</div>}
                        </div>
                    ) : appStage === 'roadmap' ? (
                        /* â”€â”€ STAGE 4: Roadmap Display â”€â”€ */
                        <div className="roadmap-display-stage glass-card">
                            <div className="roadmap-display-header">
                                <button className="back-btn" onClick={() => setAppStage('roadmap-choice')}>
                                    <ArrowLeft size={18} />
                                </button>
                                <div>
                                    <h3>ðŸ—ºï¸ Your Learning Roadmap</h3>
                                    <div className="roadmap-meta">
                                        <span className="meta-badge">â±ï¸ {roadmapData?.estimated_time}</span>
                                        <span className="meta-badge">ðŸ“Š {roadmapData?.difficulty}</span>
                                        <span className="meta-badge">{roadmapType === 'full' ? 'ðŸ“š Full' : 'âš¡ Short'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="roadmap-topic-title">
                                {selectedSubtopic?.emoji} {topic} â†’ {selectedSubtopic?.title}
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
                                {isLoading ? <><Loader2 className="animate-spin" size={20} /> Starting...</> : <>ðŸš€ Start Learning from Step 1 <ChevronRight size={20} /></>}
                            </motion.button>
                        </div>
                    ) : appStage === 'course-structure' ? (
                        <CourseStructureView 
                            courseData={courseData} 
                            topic={topic} 
                            onBack={() => setAppStage('roadmap-choice')} 
                            onBookSelect={handleBookSelect} 
                        />
                    ) : appStage === 'course-index' ? (
                        <CourseIndexView 
                            bookIndex={bookIndex} 
                            selectedBook={selectedBook} 
                            onBack={() => setAppStage('course-structure')} 
                            onStartTopic={startCourseTopic} 
                            isLoading={isLoading}
                        />
                    ) : (
                        /* â”€â”€ STAGE 1: Home / Topic Input â”€â”€ */
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
                                        <option value="beginner">ðŸ‘¶ Beginner</option>
                                        <option value="practical">ðŸ› ï¸ Practical</option>
                                        <option value="deep">ðŸ§  Deep</option>
                                    </select>
                                </div>

                                <div className="input-group flex-1">
                                    <label>Language</label>
                                    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                        <option value="English">ðŸ‡¬ðŸ‡§ English</option>
                                        <option value="Hindi">ðŸ‡®ðŸ‡³ Hindi</option>
                                        <option value="Hinglish">ðŸ‡®ðŸ‡³ Hinglish</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="start-btn" disabled={isLoading || cooldown > 0}>
                                {isLoading ? <><Loader2 className="animate-spin" size={20} /> Exploring...</> : cooldown > 0 ? `Wait ${cooldown}s...` : <>Explore Topic <ChevronRight size={20} /></>}
                            </button>
                            {error && <div className="error-banner">{error}</div>}
                        </form>
                    )}

                    {sessions.length > 0 && appStage === 'home' && (
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
                                            <span>{s.mode} â€¢ {s.language}</span>
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
            </div>
        );
    }

    return (
        <div className="App">
            <div className="bg-glow-container">
                <div className="glow-blob glow-blob-1"></div>
                <div className="glow-blob glow-blob-2"></div>
            </div>
            <div className="chat-container">
                {/* ðŸ›‘ ROADMAP FOCUS GUARD â€” Exit Warning Modal */}
                {showExitWarning && (
                    <div className="exit-warning-overlay">
                        <div className="exit-warning-modal glass-card">
                            <div className="exit-warning-icon">ðŸ›‘</div>
                            <h3>{language === 'English' ? 'Leave Roadmap?' : 'Roadmap Chodna?'}</h3>
                            <p>
                                {language === 'English'
                                    ? <>You are currently learning <strong>{topic}</strong>!<br />Are you sure you want to leave this roadmap?</>
                                    : <>Aap abhi <strong>{topic}</strong> seekh rahe ho!<br />Is roadmap ko beech mein chhod doge?</>
                                }
                            </p>
                            <div className="exit-warning-tip">
                                {language === 'English'
                                    ? <>ðŸ’¡ <em>Complete this first â€” then we can start a new topic!</em></>
                                    : <>ðŸ’¡ <em>Pehle ye complete karo â€” phir naya topic start karte hain!</em></>
                                }
                            </div>
                            <div className="exit-warning-buttons">
                                <button
                                    className="exit-continue-btn"
                                    onClick={() => setShowExitWarning(false)}
                                >
                                    {language === 'English' ? 'âœ… Continue Learning' : 'âœ… Continue Learning'}
                                </button>
                                <button
                                    className="exit-leave-btn"
                                    onClick={forceReset}
                                >
                                    {language === 'English' ? 'ðŸšª Leave Anyway' : 'ðŸšª Leave Anyway'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Structural Flex Container */}
                <div className="chat-content-split">
                    {/* ðŸ“ Left Side: Main Column (Header + Messages + Input) */}
                    <div className="messages-container">
                        <header className="chat-header">
                            <div className="header-pill-inner">
                                <div className="header-left">
                                    <button onClick={resetChat} className="back-btn" title="Go back to setup">
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="header-text-container">
                                        <h2 title={topic}>{topic}</h2>
                                        <div className="header-meta-slim">
                                            <span className="mode-tag">{mode}</span>
                                            <span className="lang-tag">{language}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="header-center-stats hide-mobile">
                                    <div className="compact-stat" title="XP Points">
                                        <Sparkles size={14} />
                                        <span>{xp} XP</span>
                                    </div>
                                    <div className="stat-separator" />
                                    <div className="compact-stat" title="Progress">
                                        <Trophy size={14} />
                                        <span>{progress.step}/{progress.total_steps}</span>
                                    </div>
                                </div>

                                <div className="header-right">
                                    {roadmapType === 'course' && (
                                        <button 
                                            className="course-nav-btn glass-card"
                                            onClick={() => setAppStage('course-index')}
                                            title="Back to Course Index"
                                        >
                                            <BookOpen size={18} />
                                            <span className="hide-mobile">Course</span>
                                        </button>
                                    )}
                                    <button
                                        className={`dashboard-pulse-btn ${showTrackSidebar ? 'active' : ''}`}
                                        onClick={() => setShowTrackSidebar(!showTrackSidebar)}
                                        title="Toggle Dashboard"
                                    >
                                        <LayoutDashboard size={18} />
                                        <span className="hide-mobile">Dashboard</span>
                                    </button>
                                </div>
                            </div>
                        </header>

                        <div className="messages-list">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    style={{ willChange: 'transform, opacity' }}
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

                        {error && (
                            <div className="chat-error-banner animate-fade-in">
                                <span className="error-text">âš ï¸ {error}</span>
                                <button className="clear-error-btn" onClick={() => setError(null)} title="Clear error">
                                    <X size={18} />
                                </button>
                            </div>
                        )}



                        <form onSubmit={sendMessage} className="input-area">
                            <input
                                type="text"
                                placeholder="Respond to the tutor..."
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    if (error) setError(null);
                                }}
                                disabled={isLoading}
                            />
                            <button type="submit" disabled={isLoading || !input.trim() || cooldown > 0}>
                                {cooldown > 0 ? (
                                    <span className="cooldown-badge">
                                        <Clock size={14} />
                                        {cooldown}s
                                    </span>
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>

                        </form>
                    </div>
                </div>

                {/* ðŸ—ºï¸  DESKTOP SIDEBAR â€” moved OUTSIDE the flex container to prevent flex recalculation bugs when typing */}
                {isDesktop && roadmapData?.steps && (
                    <aside className="progress-sidebar desktop-fixed">
                        <SidebarContent
                            activeSidebarTab={activeSidebarTab}
                            setActiveSidebarTab={stableSetActiveSidebarTab}
                            roadmapData={roadmapData}
                            progress={progress}
                            autoNotes={autoNotes}
                            manualNotes={manualNotes}
                            setManualNotes={stableSetManualNotes}
                            handleDownloadAINotes={handleDownloadAINotes}
                            handleDownloadManualNotes={handleDownloadManualNotes}
                            handleGenerateNotes={handleGenerateNotes}
                            isGeneratingNotes={isGeneratingNotes}
                            isDesktop={true}
                            onClose={stableCloseSidebar}
                            onLogout={handleLogout}
                            onReset={resetChat}
                        />
                    </aside>
                )}

                {/* ðŸ“± MOBILE SIDEBAR â€” animated overlay only on small screens */}
                {!isDesktop && (
                    <AnimatePresence initial={false}>
                        {showTrackSidebar && (
                            <motion.aside
                                initial={{ x: '100%', opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: '100%', opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                style={{ willChange: 'transform' }}
                                className="progress-sidebar"
                            >
                                <SidebarContent
                                    activeSidebarTab={activeSidebarTab}
                                    setActiveSidebarTab={stableSetActiveSidebarTab}
                                    roadmapData={roadmapData}
                                    progress={progress}
                                    autoNotes={autoNotes}
                                    manualNotes={manualNotes}
                                    setManualNotes={stableSetManualNotes}
                                    handleDownloadAINotes={handleDownloadAINotes}
                                    handleDownloadManualNotes={handleDownloadManualNotes}
                                    handleGenerateNotes={handleGenerateNotes}
                                    isGeneratingNotes={isGeneratingNotes}
                                    isDesktop={false}
                                    onClose={stableCloseSidebar}
                                    onLogout={handleLogout}
                                    onReset={resetChat}
                                />
                            </motion.aside>
                        )}
                    </AnimatePresence>
                )}

            </div>
        </div>
    );
}

export default App;

