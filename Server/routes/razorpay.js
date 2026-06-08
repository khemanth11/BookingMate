import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking.js';

dotenv.config();
const router = express.Router();

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-token-key-change-me');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

// Create Order
router.post('/create-order', auth, async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;
        
        // Ensure amount is a valid number and convert to integer paise
        let numericAmount = 0;
        if (typeof amount === 'string') {
            const match = amount.match(/[\d.]+/);
            if (match) {
                numericAmount = parseFloat(match[0]);
            }
        } else if (typeof amount === 'number') {
            numericAmount = amount;
        }

        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount provided' });
        }

        const options = {
            amount: Math.round(numericAmount * 100), // Razorpay requires an integer in paise
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        // Return the order + the key_id so client doesn't need to hardcode it
        res.status(200).json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ 
            message: 'Error creating Razorpay order', 
            details: error.error || error.message || error 
        });
    }
});

// Verify Payment
router.post('/verify', auth, async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            bookingId 
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment successful
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            
            const booking = await Booking.findById(bookingId).populate('listingId');
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            let numericAmount = 0;
            const priceVal = booking.listingId?.price;
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

            booking.paymentStatus = 'paid';
            booking.razorpayOrderId = razorpay_order_id;
            booking.razorpayPaymentId = razorpay_payment_id;
            booking.razorpaySignature = razorpay_signature;
            booking.payoutOtp = otp;
            booking.amountPaid = numericAmount;
            booking.paymentDoneAt = new Date();
            
            await booking.save();
            
            return res.status(200).json({ message: "Payment verified successfully", otp });
        } else {
            return res.status(400).json({ message: "Invalid signature" });
        }
    } catch (error) {
        console.error('Razorpay Verify Error:', error);
        res.status(500).json({ message: 'Error verifying payment' });
    }
});

export default router;

