import express from 'express';
import Message from '../models/Message.js';
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

// GET messages for a specific booking
router.get('/:bookingId', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Security check: Only the consumer or provider of this booking can view its messages
        if (booking.userId.toString() !== req.user.id && booking.providerId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized access to this chat' });
        }

        // Security check 2: Chat is only allowed if the booking is currently 'confirmed'
        if (booking.status !== 'confirmed') {
            return res.status(403).json({ message: 'Chat is only available for confirmed bookings.' });
        }

        const messages = await Message.find({ bookingId: req.params.bookingId }).sort({ createdAt: 1 });
        res.json(messages);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
