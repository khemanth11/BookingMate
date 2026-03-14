import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    location: {
        latitude: {
            type: Number,
            default: 17.3850 // Default to Hyderabad
        },
        longitude: {
            type: Number,
            default: 78.4867
        },
        address: {
            type: String,
            default: ''
        }
    },
    available: {
        type: Boolean,
        default: true
    },
    availability: [{
        dayOfWeek: { type: Number }, // 0 (Sunday) to 6 (Saturday)
        startTime: { type: String }, // "09:00"
        endTime: { type: String }    // "17:00"
    }],
    blockedDates: [{
        type: String  // "YYYY-MM-DD" format
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Listing', listingSchema);
