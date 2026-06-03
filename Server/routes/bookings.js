import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import jwt from 'jsonwebtoken';
import { sendNotification } from '../utils/notifications.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';

const router = express.Router();

// Middleware to verify JWT token
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-token-key-change-me');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// @route   GET api/bookings/stats
// @desc    Get provider booking statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
    try {
        // Ensure only providers can access their stats
        if (req.user.role !== 'provider') {
            return res.status(403).json({ message: 'Access denied. Only providers can view booking statistics.' });
        }

        const providerId = new mongoose.Types.ObjectId(req.user.id);

        const stats = await Booking.aggregate([
            {
                $match: { providerId: providerId }
            },
            {
                $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $in: ['$status', ['completed', 'verified']] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    totalBookings: 1,
                    completed: 1,
                    cancelled: 1,
                    pending: 1,
                }
            }
        ]);

        const completedBookingsWithListing = await Booking.find({
            providerId: req.user.id,
            status: { $in: ['completed', 'verified'] }
        }).populate('listingId', 'price');

        const totalEarnings = completedBookingsWithListing.reduce((acc, booking) => {
            return acc + (booking.listingId ? booking.listingId.price : 0);
        }, 0);

        const finalStats = stats.length > 0 ? { ...stats[0], totalEarnings } : {
            totalBookings: 0,
            completed: 0,
            cancelled: 0,
            pending: 0,
            totalEarnings: 0
        };

        res.json(finalStats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST: Create a new booking request (Consumer)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'consumer') {
        return res.status(403).json({ message: 'Only consumers can create booking requests' });
    }

    try {
        const { providerId, listingId, date, startTime, endTime, notes } = req.body;

        if (!providerId || !listingId || !date || !startTime || !endTime) {
            return res.status(400).json({ message: 'Missing required scheduling fields' });
        }

        // Check if the date is blocked by the provider
        const listing = await Listing.findById(listingId);
        if (listing && listing.blockedDates && listing.blockedDates.includes(date)) {
            return res.status(400).json({ message: 'This date is unavailable. The provider has blocked this date.' });
        }

        const newBooking = new Booking({
            userId: req.user.id,
            providerId,
            listingId,
            date,
            startTime,
            endTime,
            notes
        });

        const booking = await newBooking.save();

        // Notify Provider
        const consumer = await User.findById(req.user.id);
        sendNotification(
            providerId,
            'New Booking Request! 📅',
            `${consumer.name} wants to book: ${listing.name}`,
            { bookingId: booking._id }
        );

        res.json(booking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET: Get all bookings for the logged-in Consumer
router.get('/me', auth, async (req, res) => {
    try {
        if (req.user.role !== 'consumer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const bookings = await Booking.find({ userId: req.user.id })
            .populate('providerId', 'name phone')
            .populate('listingId', 'name category price')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// GET: Get all incoming booking requests for the logged-in Provider
router.get('/provider', auth, async (req, res) => {
    try {
        if (req.user.role !== 'provider') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const bookings = await Booking.find({ providerId: req.user.id })
            .populate('userId', 'name phone')
            .populate('listingId', 'name category price')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT: Provider verifies completion (e.g. via AI Image)
router.put('/:id/provider-verify', auth, async (req, res) => {
    try {
        if (req.user.role !== 'provider') {
            return res.status(403).json({ message: 'Access denied' });
        }

        let booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.providerVerified = true;
        booking.status = 'completed'; // Mark as completed on provider side
        await booking.save();

        // Check for fund release
        await checkAndReleaseFunds(booking);

        res.json({ message: 'Provider/AI verification successful', booking });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT: Consumer verifies completion and releases funds
router.put('/:id/consumer-verify', auth, async (req, res) => {
    try {
        if (req.user.role !== 'consumer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        let booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        booking.consumerVerified = true;
        await booking.save();

        // Check for fund release
        const updatedBooking = await checkAndReleaseFunds(booking);

        res.json({ message: 'Consumer verification successful', booking: updatedBooking });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Helper: Check and Release Funds
async function checkAndReleaseFunds(booking) {
    if (booking.consumerVerified && booking.providerVerified && !booking.payoutReleased) {
        // Find or create provider wallet
        let wallet = await Wallet.findOne({ providerId: booking.providerId });
        if (!wallet) {
            wallet = new Wallet({ providerId: booking.providerId });
        }

        // Fetch price if not on booking
        let amount = booking.amountPaid || 0;
        if (amount === 0) {
            const listing = await Listing.findById(booking.listingId);
            amount = listing ? listing.price : 0;
        }

        // Safely extract number from string (e.g. "100 / hour" -> 100)
        let numericAmount = 0;
        if (typeof amount === 'string') {
            const match = amount.match(/[\d.]+/);
            if (match) {
                numericAmount = parseFloat(match[0]);
            }
        } else if (typeof amount === 'number') {
            numericAmount = amount;
        }

        wallet.balance += numericAmount;
        wallet.transactions.push({
            amount: numericAmount,
            type: 'credit',
            status: 'completed',
            bookingId: booking._id,
            timestamp: new Date()
        });

        await wallet.save();
        
        booking.payoutReleased = true;
        booking.status = 'verified'; // Final state
        await booking.save();
        return booking;
    }
    return booking;
}

// PUT: Consumer cancels their own booking
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        if (req.user.role !== 'consumer') {
            return res.status(403).json({ message: 'Only consumers can cancel their bookings via this route' });
        }

        let booking = await Booking.findById(req.params.id).populate('listingId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Ensure this consumer owns the booking
        if (booking.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to cancel this booking' });
        }

        // Only allow cancellation if pending or confirmed
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ message: `Cannot cancel booking with status: ${booking.status}` });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Notify Provider
        sendNotification(
            booking.providerId,
            'Booking Cancelled ❌',
            `The booking for ${booking.listingId.name} was cancelled by the consumer.`,
            { bookingId: booking._id }
        );

        res.json(booking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// PUT: Provider updates booking status (confirmed, rejected)
router.put('/:id/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'provider') {
            return res.status(403).json({ message: 'Only providers can update status' });
        }

        const { status } = req.body;
        let booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.providerId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Only allow valid statuses from provider
        if (!['confirmed', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status update' });
        }

        booking.status = status;
        await booking.save();

        res.json(booking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
