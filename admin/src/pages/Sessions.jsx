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
        s.topic.toLowerCase().includes(search.toLowerCase())
    );

    return (
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
                        placeholder="Search by user or topic..."
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
                                        <span className="flex-center gap-1"><User size={12} /> {session.userId?.email || 'Guest User'}</span>
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
                    )
                ))}
            </div>

            {/* Session Detail Modal */}
            <AnimatePresence>
                {selectedSession && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                        onClick={() => setSelectedSession(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="card flex-col"
                            style={{ width: '100%', maxWidth: '800px', height: '85vh', padding: 0, overflow: 'hidden' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-medium)', background: 'rgba(255,255,255,0.02)' }} className="flex-between">
                                <div className="flex-col gap-1">
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', textTransform: 'capitalize' }}>{selectedSession.topic}</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Full history for {selectedSession.userId?.email}</p>
                                </div>
                                <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setSelectedSession(null)}>
                                    <X size={24} />
                                </button>
                            </header>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }} className="flex-col gap-6">
                                {selectedSession.messages && selectedSession.messages.length > 0 ? (
                                    selectedSession.messages.map((msg, mIdx) => (
                                        <div key={mIdx} className="flex-col gap-2" style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                            <div className="flex-center gap-2" style={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                                {msg.role === 'user' ? (
                                                    <><span style={{ color: 'var(--primary-light)' }}>Student</span> <UserCircle size={14} /></>
                                                ) : (
                                                    <><Bot size={14} /> <span style={{ color: 'var(--accent-emerald)' }}>AI Tutor</span></>
                                                )}
                                            </div>
                                            <div style={{ 
                                                padding: '1rem 1.25rem', 
                                                borderRadius: msg.role === 'user' ? '1.25rem 1.25rem 0 1.25rem' : '1.25rem 1.25rem 1.25rem 0',
                                                background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                border: msg.role === 'user' ? 'none' : '1px solid var(--border-medium)',
                                                color: 'white',
                                                fontSize: '0.95rem',
                                                lineHeight: '1.6'
                                            }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)' }}>No messages in this session.</div>
                                )}
                            </div>

                            <footer style={{ padding: '1.25rem 2rem', borderTop: '1px solid var(--border-medium)', background: 'rgba(255,255,255,0.02)' }} className="flex-between">
                                <span className="badge-primary" style={{ padding: '0.4rem 0.8rem' }}>{selectedSession.mode} mode</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selectedSession.messages?.length || 0} interactions</span>
                                <button className="btn btn-primary" onClick={() => setSelectedSession(null)}>Close View</button>
                            </footer>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SessionsList;
