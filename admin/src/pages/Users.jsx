import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../api/admin';
import { Trash2, Shield, User, Search, Filter, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await getUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? All their session data will be lost.')) return;
        
        try {
            await deleteUser(id);
            setUsers(users.filter(u => u._id !== id));
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex-col gap-6 animate-fade-in">
            <header className="flex-between">
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }}>User Management</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage accounts and permissions</p>
                </div>
                <div className="input-with-icon" style={{ width: '320px' }}>
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-control"
                    />
                </div>
            </header>

            <div className="table-container shadow-xl">
                <table>
                    <thead>
                        <tr>
                            <th>User Info</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>API Config</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading users list...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No users matching your search</td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <motion.tr 
                                    key={user._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, x: -10 }}
                                >
                                    <td>
                                        <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                                                {user.email[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '600' }}>{user.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <span className={`badge ${user.encryptedApiKey ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                                            {user.encryptedApiKey ? 'AUTHENTICATED' : 'KEY MISSING'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="flex-center gap-2" style={{ justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => handleDelete(user._id)}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.5rem', color: 'var(--accent-rose)' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersList;
