import express from 'express';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import Wallet from '../models/Wallet.js';
import Review from '../models/Review.js';
import jwt from 'jsonwebtoken';
import { checkAndReleaseFunds } from './bookings.js';
import Config from '../models/Config.js';
import { sendNotification } from '../utils/notifications.js';

const router = express.Router();

// Admin Middleware
const adminAuth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-token-key-change-me');
        if (decoded.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admin role required' });
        }
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// @route   GET /api/admin/stats
// @desc    Get global platform statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalListings = await Listing.countDocuments();
        const totalBookings = await Booking.countDocuments();
        
        // Calculate total revenue (paid bookings * parsed numeric listing price)
        const paidBookings = await Booking.find({ paymentStatus: 'paid' }).populate('listingId', 'price');
        const totalRevenue = paidBookings.reduce((sum, b) => {
            const priceVal = b.listingId?.price;
            let numericAmount = 0;
            if (priceVal) {
                if (typeof priceVal === 'string') {
                    const match = priceVal.match(/[\d.]+/);
                    if (match) {
                        numericAmount = parseFloat(match[0]);
                    }
                } else if (typeof priceVal === 'number') {
                    numericAmount = priceVal;
                }
            }
            return sum + (isNaN(numericAmount) ? 0 : numericAmount);
        }, 0);
        // Calculate platform net commission profit
        const verifiedBookings = await Booking.find({ status: 'verified' });
        const netProfit = verifiedBookings.reduce((sum, b) => sum + (b.commissionEarned || 0), 0);

        res.json({
            users: totalUsers,
            listings: totalListings,
            bookings: totalBookings,
            revenue: totalRevenue,
            netProfit: netProfit
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/verify-user/:id
// @desc    Toggle user verification status (KYC)
router.put('/verify-user/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isVerified = !user.isVerified;
        await user.save();

        res.json({ message: `User ${user.isVerified ? 'verified' : 'unverified'}`, isVerified: user.isVerified });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/listings
// @desc    Get all listings
router.get('/listings', adminAuth, async (req, res) => {
    try {
        const listings = await Listing.find().populate('providerId', 'name email');
        res.json(listings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/listings/:id
// @desc    Admin delete any listing
router.delete('/listings/:id', adminAuth, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        await Listing.findByIdAndDelete(req.params.id);
        res.json({ message: 'Listing removed by admin' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/bookings
// @desc    Get all platform bookings for auditing
router.get('/bookings', adminAuth, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('userId', 'name email phone')
            .populate('providerId', 'name email phone')
            .populate('listingId', 'name category price')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/bookings/:id/resolve
// @desc    Admin override to resolve booking disputes (force complete/cancel)
router.put('/bookings/:id/resolve', adminAuth, async (req, res) => {
    try {
        const { action } = req.body; // 'complete' or 'cancel'
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (action === 'complete') {
            booking.status = 'verified';
            booking.consumerVerified = true;
            booking.providerVerified = true;
            booking.completedAt = new Date();
            await booking.save();
            await checkAndReleaseFunds(booking);
            
            // Notify parties
            await sendNotification(booking.providerId, 'Dispute Resolved ✅', `Admin resolved dispute. Payout for booking ${booking._id} has been released.`);
            await sendNotification(booking.userId, 'Dispute Resolved ⚙️', `Admin resolved dispute. Payout for booking ${booking._id} has been released to provider.`);
            
            res.json({ message: 'Booking completed and funds released by admin', booking });
        } else if (action === 'cancel') {
            booking.status = 'cancelled';
            booking.paymentStatus = 'refunded';
            booking.cancelledAt = new Date();
            await booking.save();
            
            // Notify parties
            await sendNotification(booking.providerId, 'Dispute Resolved ⚙️', `Admin resolved dispute. Booking ${booking._id} cancelled and consumer refunded.`);
            await sendNotification(booking.userId, 'Dispute Resolved 💸', `Admin resolved dispute. Payment for booking ${booking._id} has been refunded.`);
            
            res.json({ message: 'Booking cancelled and payment refunded by admin', booking });
        } else {
            res.status(400).json({ message: 'Invalid action. Must be complete or cancel.' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/settings
// @desc    Get platform configuration settings
router.get('/settings', adminAuth, async (req, res) => {
    try {
        let config = await Config.findOne({ key: 'global' });
        if (!config) {
            config = new Config({ key: 'global' });
            await config.save();
        }
        res.json(config);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/settings
// @desc    Update platform configuration settings
router.put('/settings', adminAuth, async (req, res) => {
    try {
        const { commissionRate, maintenanceMode } = req.body;
        let config = await Config.findOne({ key: 'global' });
        if (!config) {
            config = new Config({ key: 'global' });
        }
        if (commissionRate !== undefined) config.commissionRate = Number(commissionRate);
        if (maintenanceMode !== undefined) config.maintenanceMode = maintenanceMode;
        config.updatedAt = Date.now();
        await config.save();
        res.json(config);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/payouts
// @desc    Get all withdrawal/payout requests (pending, completed, rejected)
router.get('/payouts', adminAuth, async (req, res) => {
    try {
        const wallets = await Wallet.find({
            'transactions.type': 'debit'
        }).populate('providerId', 'name email phone bankDetails');

        const allPayouts = [];
        wallets.forEach(wallet => {
            wallet.transactions.forEach(tx => {
                if (tx.type === 'debit') {
                    allPayouts.push({
                        walletId: wallet._id,
                        transactionId: tx._id,
                        provider: wallet.providerId,
                        amount: tx.amount,
                        status: tx.status,
                        timestamp: tx.timestamp
                    });
                }
            });
        });

        allPayouts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(allPayouts);
    } catch (err) {
        console.error('Error fetching payouts:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/payouts/:walletId/transaction/:txId/resolve
// @desc    Approve or Reject a pending payout request
router.put('/payouts/:walletId/transaction/:txId/resolve', adminAuth, async (req, res) => {
    try {
        const { action } = req.body;
        const { walletId, txId } = req.params;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Must be approve or reject.' });
        }

        const wallet = await Wallet.findById(walletId);
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        const tx = wallet.transactions.id(txId);
        if (!tx) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (tx.status !== 'pending') {
            return res.status(400).json({ message: 'Transaction is already resolved' });
        }

        if (action === 'approve') {
            tx.status = 'completed';
            await sendNotification(wallet.providerId, 'Payout Successful 💸', `Your withdrawal request of ₹${tx.amount} has been approved and processed.`);
        } else if (action === 'reject') {
            tx.status = 'rejected';
            wallet.balance += tx.amount;
            await sendNotification(wallet.providerId, 'Payout Rejected ❌', `Your withdrawal request of ₹${tx.amount} was rejected. Funds have been refunded to your wallet.`);
        }

        await wallet.save();
        res.json({ message: `Payout request ${action}d successfully`, wallet });
    } catch (err) {
        console.error('Error resolving payout:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/reviews
// @desc    Get all reviews for moderation
router.get('/reviews', adminAuth, async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('reviewerId', 'name email')
            .populate('revieweeId', 'name email')
            .populate('listingId', 'name category')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error('Error fetching reviews:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete a review (moderation)
router.delete('/reviews/:id', adminAuth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Error deleting review:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/kyc-pending
// @desc    Get all providers with submitted KYC documents (pending, verified, rejected)
router.get('/kyc-pending', adminAuth, async (req, res) => {
    try {
        const users = await User.find({
            'kycDocument.status': { $in: ['pending', 'verified', 'rejected'] }
        }).select('-password');
        res.json(users);
    } catch (err) {
        console.error('Error fetching KYC records:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/verify-kyc/:id
// @desc    Approve or reject a provider's KYC document
router.put('/verify-kyc/:id', adminAuth, async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Must be approve or reject.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Provider not found' });

        if (action === 'approve') {
            user.kycDocument.status = 'verified';
            user.isVerified = true;
            await sendNotification(user._id, 'Identity Verified ✅', 'Your KYC documents have been verified. Withdrawal requests are now unlocked.');
        } else {
            user.kycDocument.status = 'rejected';
            user.isVerified = false;
            await sendNotification(user._id, 'KYC Verification Failed ❌', 'Your KYC document submission was rejected. Please re-upload a clear copy in Account Settings.');
        }

        await user.save();
        res.json({ message: `KYC submission successfully ${action}d`, user });
    } catch (err) {
        console.error('Error verifying KYC:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
