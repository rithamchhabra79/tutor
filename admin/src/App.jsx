import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/Users';
import SessionsList from './pages/Sessions';

const App = () => {
    return (
        <Router>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Admin Routes */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <div className="admin-layout">
                            <Sidebar />
                            <main className="main-content">
                                <Dashboard />
                            </main>
                        </div>
                    </ProtectedRoute>
                } />

                <Route path="/users" element={
                    <ProtectedRoute>
                        <div className="admin-layout">
                            <Sidebar />
                            <main className="main-content">
                                <UsersList />
                            </main>
                        </div>
                    </ProtectedRoute>
                } />

                <Route path="/sessions" element={
                    <ProtectedRoute>
                        <div className="admin-layout">
                            <Sidebar />
                            <main className="main-content">
                                <SessionsList />
                            </main>
                        </div>
                    </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
};

export default App;
