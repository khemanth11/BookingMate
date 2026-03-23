import express from 'express';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Middleware to verify JWT token
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-token-key-change-me');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// @route   POST /api/payments/create-payment-intent
// @desc    Create a Stripe Payment Intent for a booking
router.post('/create-payment-intent', auth, async (req, res) => {
    try {
        const { amount, currency } = req.body;

        if (!amount) {
            return res.status(400).json({ message: 'Amount is required' });
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in paise/cents
            currency: currency || 'inr',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: req.user.id
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (err) {
        console.error('Stripe Error:', err.message);
        res.status(500).json({ message: 'Stripe Internal Error', error: err.message });
    }
});

// @route   POST /api/payments/confirm-payment
// @desc    Update booking status after mobile payment confirmation
router.post('/confirm-payment', auth, async (req, res) => {
    try {
        const { bookingId, paymentIntentId } = req.body;
        
        let booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Update booking status
        booking.paymentStatus = 'paid';
        booking.stripePaymentIntentId = paymentIntentId;
        await booking.save();

        res.json({ message: 'Payment confirmed and booking updated', booking });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
