import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, LogOut, ShieldCheck } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.setItem('admin_token', admin_token); // Actually admin_token is not a variable, fixing it
        localStorage.removeItem('admin_token');
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="flex-center gap-3" style={{ marginBottom: '3rem', justifyContent: 'flex-start', padding: '0 0.5rem' }}>
                <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '0.75rem' }}>
                    <ShieldCheck className="text-white" size={24} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Admin</h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Tutor AI</p>
                </div>
            </div>

            <nav className="flex-col gap-2" style={{ flex: 1 }}>
                <NavLink 
                    to="/" 
                    className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink 
                    to="/users" 
                    className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}
                >
                    <Users size={20} />
                    <span>Users</span>
                </NavLink>

                <NavLink 
                    to="/sessions" 
                    className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}
                >
                    <MessageSquare size={20} />
                    <span>Sessions</span>
                </NavLink>
            </nav>

            <button 
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ marginTop: 'auto', justifyContent: 'flex-start', gap: '1rem', color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
            >
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </aside>
    );
};

export default Sidebar;
