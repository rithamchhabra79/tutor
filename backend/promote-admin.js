import mongoose from 'mongoose';
import { User } from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const emailToPromote = process.argv[2];

if (!emailToPromote) {
    console.error('Usage: node promote-admin.js <email>');
    process.exit(1);
}

const promote = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOneAndUpdate({ email: emailToPromote }, { role: 'admin' }, { new: true });
        
        if (!user) {
            console.error(`User with email ${emailToPromote} not found.`);
        } else {
            console.log(`✅ Success! User ${emailToPromote} is now an admin.`);
        }
        await mongoose.connection.close();
    } catch (err) {
        console.error('Error promoting user:', err);
        process.exit(1);
    }
};

promote();
