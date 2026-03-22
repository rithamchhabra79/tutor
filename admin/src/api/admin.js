import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const adminApi = axios.create({
    baseURL: API_BASE_URL,
});

// Interceptor to add auth token
adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = (identifier, password) => adminApi.post('/auth/login', { identifier, password });
export const getUsers = () => adminApi.get('/admin/users');
export const deleteUser = (id) => adminApi.delete(`/admin/users/${id}`);
export const getSessions = () => adminApi.get('/admin/sessions');
export const checkMe = () => adminApi.get('/auth/me');

export default adminApi;
