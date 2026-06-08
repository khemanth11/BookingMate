import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
    key: {
        type: String,
        default: 'global',
        unique: true
    },
    commissionRate: {
        type: Number,
        default: 10 // 10% default platform commission fee
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Config', configSchema);
