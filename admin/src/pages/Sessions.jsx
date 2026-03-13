import React, { useState, useEffect } from 'react';
import { getSessions } from '../api/admin';
import { MessageSquare, Calendar, User, Search, ChevronRight, X, UserCircle, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SessionsList = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data } = await getSessions();
                setSessions(data);
            } catch (err) {
                console.error("Failed to fetch sessions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    const filteredSessions = sessions.filter(s => 
        (s.userId?.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.userId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.userId?.phoneNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        s.topic.toLowerCase().includes(search.toLowerCase())
    );

    const renderMessageContent = (content) => {
        if (!content) return null;
        
        try {
            // Check if it's a JSON string
            if (content.trim().startsWith('{')) {
                const parsed = JSON.parse(content);
                
                // If it has tutor fields, render them nicely
                if (parsed.explanation || parsed.redirect || parsed.analogy || parsed.task) {
                    return (
                        <div className="flex-col gap-4">
                            {parsed.redirect && (
                                <div style={{ borderLeft: '4px solid #ef4444', padding: '0.8rem 1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
                                    <strong style={{ display: 'block', color: '#ef4444', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Off-Topic Guard</strong>
                                    {parsed.redirect}
                                </div>
                            )}
                            {parsed.explanation && (
                                <div style={{ whiteSpace: 'pre-wrap' }}>{parsed.explanation}</div>
                            )}
                            {parsed.analogy && (
                                <div style={{ borderLeft: '4px solid #f59e0b', padding: '0.8rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem' }}>
                                    <strong style={{ display: 'block', color: '#f59e0b', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Analogy</strong>
                                    {parsed.analogy}
                                </div>
                            )}
                            {parsed.mastery_check && (
                                <div style={{ borderLeft: '4px solid #6366f1', padding: '0.8rem 1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.5rem' }}>
                                    <strong style={{ display: 'block', color: '#818cf8', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Quick Check</strong>
                                    <p style={{ fontWeight: '600', marginBottom: '0.8rem' }}>{parsed.mastery_check.question}</p>
                                    <div className="flex-col gap-2">
                                        {parsed.mastery_check.options?.map((opt, i) => (
                                            <div key={i} style={{ 
                                                padding: '0.6rem 0.8rem', 
                                                background: i === parsed.mastery_check.correct_index ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                border: i === parsed.mastery_check.correct_index ? '1px solid #10b981' : '1px solid var(--border-light)',
                                                borderRadius: '0.5rem',
                                                fontSize: '0.85rem'
                                            }}>
                                                {opt} {i === parsed.mastery_check.correct_index && '✓'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {parsed.task && (
                                <div style={{ borderLeft: '4px solid #10b981', padding: '0.8rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem' }}>
                                    <strong style={{ display: 'block', color: '#10b981', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Task</strong>
                                    <p>{parsed.task}</p>
                                </div>
                            )}
                        </div>
                    );
                }
            }
        } catch (e) {
            // Not JSON or parse error, fall back to plain text
        }
        
        return <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>;
    };

    return (
        <>
            <div className="flex-col gap-6 animate-fade-in">
                <header className="flex-between">
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }}>Session Logs</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Track learning interactions</p>
                    </div>
                    <div className="input-with-icon" style={{ width: '360px' }}>
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by user, phone or topic..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-control"
                        />
                    </div>
                </header>

                <div className="flex-col gap-4">
                    {loading ? (
                        <div className="card flex-center" style={{ padding: '6rem', color: 'var(--text-muted)' }}>
                            Loading interaction logs...
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="card flex-center" style={{ padding: '6rem', color: 'var(--text-muted)' }}>
                            No session activity found
                        </div>
                    ) : (
                        filteredSessions.map((session, idx) => (
                            <motion.div 
                                key={session._id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="card flex-between"
                                style={{ padding: '1.25rem 2rem', cursor: 'pointer' }}
                                onClick={() => setSelectedSession(session)}
                                whileHover={{ scale: 1.01, borderLeft: '4px solid var(--primary)' }}
                            >
                                <div className="flex-center gap-4">
                                    <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1.25rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MessageSquare size={28} />
                                    </div>
                                    <div className="flex-col gap-1">
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', textTransform: 'capitalize' }}>{session.topic}</h3>
                                        <div className="flex-center gap-4" style={{ justifyContent: 'flex-start', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <span className="flex-center gap-1">
                                                <User size={12} /> 
                                                {session.userId?.name || 'Guest'} ({session.userId?.email || 'No email'}) • {session.userId?.phoneNumber || 'No phone'}
                                            </span>
                                            <span className="flex-center gap-1"><Calendar size={12} /> {new Date(session.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-center gap-8">
                                    <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Msgs</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>{session.messages?.length || 0}</span>
                                    </div>
                                    <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mode</span>
                                        <span className="badge-primary" style={{ padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{session.mode}</span>
                                    </div>
                                    <ChevronRight style={{ color: 'var(--text-muted)' }} />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Session Detail Modal — Moved outside the animated container to fix fixed positioning */}
            <AnimatePresence>
                {selectedSession && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ 
                            position: 'fixed', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0, 
                            background: 'rgba(0,0,0,0.85)', 
                            backdropFilter: 'blur(10px)', 
                            zIndex: 9999, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            padding: '1.5rem' 
                        }}
                        onClick={() => setSelectedSession(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="card flex-col"
                            style={{ 
                                width: '100%', 
                                maxWidth: '900px', 
                                maxHeight: '90vh', 
                                padding: 0, 
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <header style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border-medium)', background: 'rgba(255,255,255,0.03)' }} className="flex-between">
                                <div className="flex-col gap-1">
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', textTransform: 'capitalize' }}>{selectedSession.topic}</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        Student: {selectedSession.userId?.name || 'Guest'} • {selectedSession.userId?.email || 'N/A'} • {selectedSession.userId?.phoneNumber || 'N/A'}
                                    </p>
                                </div>
                                <button className="btn btn-secondary" style={{ padding: '0.5rem', width: '2rem', height: '2rem' }} onClick={() => setSelectedSession(null)}>
                                    <X size={20} />
                                </button>
                            </header>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }} className="flex-col gap-8">
                                {selectedSession.messages && selectedSession.messages.length > 0 ? (
                                    selectedSession.messages.map((msg, mIdx) => (
                                        <div key={mIdx} className="flex-col gap-2" style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                            <div className="flex-center gap-2" style={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {msg.role === 'user' ? (
                                                    <><span>Student</span> <UserCircle size={14} /></>
                                                ) : (
                                                    <><Bot size={14} /> <span>AI Tutor</span></>
                                                )}
                                            </div>
                                            <div style={{ 
                                                padding: '1rem 1.25rem', 
                                                borderRadius: msg.role === 'user' ? '1.25rem 1.25rem 0 1.25rem' : '1.25rem 1.25rem 1.25rem 0',
                                                background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                border: msg.role === 'user' ? 'none' : '1px solid var(--border-medium)',
                                                color: 'white',
                                                fontSize: '0.9rem',
                                                lineHeight: '1.6',
                                                boxShadow: msg.role === 'user' ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
                                            }}>
                                                {renderMessageContent(msg.content)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)' }}>No messages in this session.</div>
                                )}
                            </div>

                            <footer style={{ padding: '1rem 2rem', borderTop: '1px solid var(--border-medium)', background: 'rgba(255,255,255,0.03)' }} className="flex-between">
                                <div className="flex-center gap-3">
                                    <span className="badge-primary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}>{selectedSession.mode} mode</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedSession.messages?.length || 0} interactions</span>
                                </div>
                                <button className="btn btn-primary" onClick={() => setSelectedSession(null)} style={{ padding: '0.5rem 1.5rem' }}>Close</button>
                            </footer>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SessionsList;
