import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    date: {
        type: String, // Storing as simple string for MVP (e.g. "2024-05-10")
        required: true
    },
    startTime: {
        type: String, // e.g., "10:00"
        required: true
    },
    endTime: {
        type: String, // e.g., "11:00"
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ''
    },
    verificationPhoto: {
        type: String, // Store Base64 or URL
        default: null
    },
    isAiVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Booking', bookingSchema);
