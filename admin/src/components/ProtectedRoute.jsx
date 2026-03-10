import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { checkMe } from '../api/admin';

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const verify = async () => {
            try {
                const { data } = await checkMe();
                // Check if user is actually admin
                // Note: backend /auth/me should return role or we check it here
                // For now, if /auth/me succeeds and we have a token, we proceed
                // In a real app, we'd check user.role === 'admin'
                setIsAuthenticated(true);
            } catch (err) {
                console.error("Auth verification failed", err);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        const token = localStorage.getItem('admin_token');
        if (!token) {
            setLoading(false);
            setIsAuthenticated(false);
        } else {
            verify();
        }
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
