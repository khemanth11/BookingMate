import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import bookingRoutes from './routes/bookings.js';
import messageRoutes from './routes/messages.js';
import aiRoutes from './routes/ai.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import paymentsRoutes from './routes/payments.js';
import razorpayRoute from './routes/razorpay.js';
import walletRoute from './routes/wallet.js';

// Models for Socket.io
import Message from './models/Message.js';
import Booking from './models/Booking.js';
import User from './models/User.js';
import { sendNotification } from './utils/notifications.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Database Successfully!');
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
    });

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/razorpay', razorpayRoute);
app.use('/api/wallet', walletRoute);

// Socket.io Logic
io.on('connection', (socket) => {
    console.log(`🔌 User Connected: ${socket.id}`);

    socket.on('join_room', (bookingId) => {
        socket.join(bookingId);
        console.log(`User ID: ${socket.id} joined room: ${bookingId}`);
    });

    socket.on('send_message', async (data) => {
        const { bookingId, senderId, text } = data;

        try {
            const newMessage = new Message({
                bookingId,
                senderId,
                text
            });
            await newMessage.save();

            io.to(bookingId).emit('receive_message', newMessage);

            // Send Push Notification to the other party
            const booking = await Booking.findById(bookingId).populate('listingId');
            if (booking) {
                const recipientId = senderId === booking.userId.toString() ? booking.providerId : booking.userId;
                const sender = await User.findById(senderId);
                
                sendNotification(
                    recipientId,
                    `New message from ${sender.name} 💬`,
                    text.length > 50 ? text.substring(0, 47) + '...' : text,
                    { bookingId, type: 'chat' }
                );
            }
        } catch (error) {
            console.error('Error saving message via socket:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 User Disconnected: ${socket.id}`);
    });
});

app.get('/', (req, res) => {
    res.send('EverythingBooking API is running!');
});

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port: ${PORT}`);
});
