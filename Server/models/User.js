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
    isVerified: {
        type: Boolean,
        default: false
    },
    expoPushToken: {
        type: String,
        default: null
    },
    bankDetails: {
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        accountHolderName: { type: String, default: '' },
        upiId: { type: String, default: '' }
    },
    kycDocument: {
        idType: { type: String, default: '' },
        base64Data: { type: String, default: '' },
        status: { type: String, enum: ['none', 'pending', 'verified', 'rejected'], default: 'none' }
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('User', userSchema);
