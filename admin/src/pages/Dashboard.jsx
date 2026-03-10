import React, { useState, useEffect } from 'react';
import { getUsers, getSessions } from '../api/admin';
import { Users, MessageSquare, Award, Clock, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const [stats, setStats] = useState({ users: 0, sessions: 0, totalMessages: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, sessionsRes] = await Promise.all([getUsers(), getSessions()]);
                const sessions = sessionsRes.data;
                const totalMsg = sessions.reduce((acc, s) => acc + (s.messages?.length || 0), 0);
                
                setStats({
                    users: usersRes.data.length,
                    sessions: sessions.length,
                    totalMessages: totalMsg
                });
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { title: 'Total Users', value: stats.users, icon: Users, color: 'var(--primary)' },
        { title: 'Sessions', value: stats.sessions, icon: MessageSquare, color: 'var(--accent-amber)' },
        { title: 'Interactions', value: stats.totalMessages, icon: Award, color: 'var(--accent-emerald)' },
        { title: 'Avg Length', value: stats.sessions ? Math.round(stats.totalMessages / stats.sessions) : 0, icon: Clock, color: 'var(--primary-light)' },
    ];

    return (
        <div className="flex-col gap-6 animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }}>Dashboard Overview</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Monitoring the AI Tutor platform</p>
            </header>

            <div className="stats-grid">
                {cards.map((card, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        className="card"
                    >
                        <div className="flex-between">
                            <div className="stat-card-icon" style={{ background: `${card.color}20`, color: card.color }}>
                                <card.icon size={28} />
                            </div>
                            <div className="badge-success flex-center gap-1" style={{ fontSize: '0.7rem' }}>
                                <ArrowUpRight size={12} /> 12%
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{card.title}</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.25rem' }}>
                                {loading ? '...' : card.value}
                            </h2>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Recent Users</h3>
                    <div className="flex-col gap-3">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex-between" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--border-light)' }}>
                                <div className="flex-center gap-3">
                                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), var(--accent-emerald))' }}></div>
                                    <div>
                                        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>User #{1000 + i}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined yesterday</p>
                                    </div>
                                </div>
                                <div className="badge-primary">NEW</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card flex-col" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '3rem' }}>
                    <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Award size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>System Quality</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '300px' }}>AI response quality and system uptime are currently optimal.</p>
                    <button className="btn btn-primary" style={{ marginTop: '2rem' }}>View Analytics</button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
