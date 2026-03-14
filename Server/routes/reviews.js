import express from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import jwt from 'jsonwebtoken';

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

// @route   POST /api/reviews
// @desc    Consumer creates a review for a completed booking
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'consumer') {
            return res.status(403).json({ message: 'Only consumers can write reviews' });
        }

        const { bookingId, rating, reviewText } = req.body;

        if (!bookingId || !rating) {
            return res.status(400).json({ message: 'bookingId and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check booking exists and is completed
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'completed') {
            return res.status(400).json({ message: 'Can only review completed bookings' });
        }
        if (booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only review your own bookings' });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this booking' });
        }

        const review = new Review({
            bookingId,
            reviewerId: req.user.id,
            revieweeId: booking.providerId,
            listingId: booking.listingId,
            rating,
            reviewText: reviewText || ''
        });

        await review.save();

        // Update listing's average rating
        const listingReviews = await Review.find({ listingId: booking.listingId });
        const avgRating = listingReviews.reduce((sum, r) => sum + r.rating, 0) / listingReviews.length;

        await Listing.findByIdAndUpdate(booking.listingId, {
            averageRating: Math.round(avgRating * 10) / 10,  // Round to 1 decimal
            totalReviews: listingReviews.length
        });

        res.json(review);
    } catch (err) {
        console.error('Review creation error:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this booking' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/reviews/listing/:listingId
// @desc    Get all reviews for a listing (Public)
router.get('/listing/:listingId', async (req, res) => {
    try {
        const reviews = await Review.find({ listingId: req.params.listingId })
            .populate('reviewerId', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/reviews/provider/:providerId
// @desc    Get all reviews for a provider (Public)
router.get('/provider/:providerId', async (req, res) => {
    try {
        const reviews = await Review.find({ revieweeId: req.params.providerId })
            .populate('reviewerId', 'name')
            .populate('listingId', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/reviews/check/:bookingId
// @desc    Check if a booking has been reviewed
router.get('/check/:bookingId', auth, async (req, res) => {
    try {
        const review = await Review.findOne({ bookingId: req.params.bookingId });
        res.json({ reviewed: !!review });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
