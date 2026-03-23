import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions: [{
        amount: { type: Number, required: true },
        type: { type: String, enum: ['credit', 'debit'], required: true },
        status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export default mongoose.model('Wallet', walletSchema);
