import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['consumer', 'provider'],
        default: 'consumer'
    },
    avatar: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        trim: true,
        default: ''
    },
    completedJobsCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('User', userSchema);
