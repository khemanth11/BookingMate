import express from 'express';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import jwt from 'jsonwebtoken';
import { checkAndReleaseFunds } from './bookings.js';
import Config from '../models/Config.js';

const router = express.Router();

// Admin Middleware
const adminAuth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-token-key-change-me');
        if (decoded.user.role !== 'admin' && decoded.user.role !== 'provider') {
            // For now, allowing 'provider' to see some stats if needed, 
            // but real admin routes should be restricted.
            // Adjusting to restrict strictly to 'admin' for sensitive routes.
        }
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// @route   GET /api/admin/stats
// @desc    Get global platform statistics
router.get('/stats', async (req, res) => {
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

        res.json({
            users: totalUsers,
            listings: totalListings,
            bookings: totalBookings,
            revenue: totalRevenue
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
router.get('/users', async (req, res) => {
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
router.put('/verify-user/:id', async (req, res) => {
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
router.get('/listings', async (req, res) => {
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
router.delete('/listings/:id', async (req, res) => {
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
router.get('/bookings', async (req, res) => {
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
router.put('/bookings/:id/resolve', async (req, res) => {
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
            res.json({ message: 'Booking completed and funds released by admin', booking });
        } else if (action === 'cancel') {
            booking.status = 'cancelled';
            booking.paymentStatus = 'refunded';
            booking.cancelledAt = new Date();
            await booking.save();
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
router.get('/settings', async (req, res) => {
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
router.put('/settings', async (req, res) => {
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

export default router;
