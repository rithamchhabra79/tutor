import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error('❌ CRITICAL: JWT_SECRET is not defined in environment variables!');
}
const JWT_SECRET = process.env.JWT_SECRET;

export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Auth token is missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user; // attach user object to req
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token is invalid or expired' });
    }
};
