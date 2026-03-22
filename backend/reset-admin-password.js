import mongoose from 'mongoose';
import { User } from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const emailToReset = process.argv[2];
const newPassword = process.argv[3];

if (!emailToReset || !newPassword) {
    console.error('Usage: node reset-admin-password.js <email> <newpassword>');
    process.exit(1);
}

const reset = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: emailToReset });

        if (!user) {
            console.error(`User with email ${emailToReset} not found.`);
        } else {
            user.password = newPassword; // This will be automatically hashed by the pre-save hook in User.js
            await user.save();
            console.log(`✅ Success! Password for ${emailToReset} has been reset to: ${newPassword}`);
            console.log(`Don't forget to delete this script if you deploy to production.`);
        }
        await mongoose.connection.close();
    } catch (err) {
        console.error('Error resetting password:', err);
        process.exit(1);
    }
};

reset();
