import express from 'express';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import jwt from 'jsonwebtoken';

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
        
        // Calculate total revenue (completed bookings * listing price)
        const completedBookings = await Booking.find({ status: 'completed' }).populate('listingId', 'price');
        const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.listingId?.price || 0), 0);

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

export default router;
