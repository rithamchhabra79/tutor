import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/admin';
import { Lock, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const { data } = await login(email, password);
            localStorage.setItem('admin_token', data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-blob" style={{ top: '-10%', left: '-10%' }}></div>
            <div className="auth-blob" style={{ bottom: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)' }}></div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="auth-card"
            >
                <div className="glass card" style={{ padding: '2.5rem', borderRadius: '2rem' }}>
                    <div className="flex-col" style={{ alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div style={{ background: 'var(--primary)', padding: '1rem', borderRadius: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 10px 20px var(--primary-glow)' }}>
                            <ShieldCheck className="text-white" size={32} />
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Admin Portal</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Sign in to manage AI Tutor</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-col gap-4">
                        {error && (
                            <div className="badge-danger" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Email Address</label>
                            <div className="input-with-icon">
                                <Mail size={20} />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-control"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div className="input-with-icon">
                                <Lock size={20} />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-control"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem' }}
                        >
                            {loading ? (
                                <div className="flex-center gap-2">
                                    <div style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    <span>Signing In...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spin { to { transform: rotate(360deg); } }
            ` }} />
        </div>
    );
};

export default Login;
