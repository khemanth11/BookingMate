import express from 'express';
import auth from '../middleware/auth.js';
import Wallet from '../models/Wallet.js';

const router = express.Router();

// Get Wallet Stats
router.get('/', auth, async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ providerId: req.user.id })
            .populate({
                path: 'transactions.bookingId',
                select: 'name date startTime endTime'
            });

        if (!wallet) {
            wallet = new Wallet({ providerId: req.user.id });
            await wallet.save();
        }

        res.status(200).json(wallet);
    } catch (error) {
        console.error('Wallet Error:', error);
        res.status(500).json({ message: 'Error fetching wallet' });
    }
});

// Request Withdrawal
router.post('/withdraw', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        const wallet = await Wallet.findOne({ providerId: req.user.id });

        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Logic here for creating a payout via Razorpay or manual admin approval
        wallet.balance -= amount;
        wallet.transactions.push({
            amount,
            type: 'debit',
            status: 'pending', // Payout pending
            timestamp: new Date()
        });

        await wallet.save();
        res.status(200).json({ message: 'Withdrawal request submitted', wallet });
    } catch (error) {
        console.error('Withdrawal Error:', error);
        res.status(500).json({ message: 'Error processing withdrawal' });
    }
});

export default router;
