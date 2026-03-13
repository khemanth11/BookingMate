import express from 'express';
import Booking from '../models/Booking.js';
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

// PUT: Provider updates the status of a booking (e.g. pending -> confirmed)
router.put('/:id/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'provider') {
            return res.status(403).json({ message: 'Only providers can update status' });
        }

        let booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Ensure this provider actually owns the listing being booked
        if (booking.providerId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to modify this booking' });
        }

        const { status } = req.body;
        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
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
