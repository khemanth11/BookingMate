const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Make sure this matches your client's origin in production
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to receive JSON from the frontend

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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/ai', require('./routes/ai'));

// Socket.io Logic
io.on('connection', (socket) => {
    console.log(`🔌 User Connected: ${socket.id}`);

    // Join a chat room based on bookingId
    socket.on('join_room', (bookingId) => {
        socket.join(bookingId);
        console.log(`User ID: ${socket.id} joined room: ${bookingId}`);
    });

    // Handle incoming messages
    socket.on('send_message', async (data) => {
        const { bookingId, senderId, text } = data;

        try {
            // Save message to database
            const Message = require('./models/Message');
            const newMessage = new Message({
                bookingId,
                senderId,
                text
            });
            await newMessage.save();

            // Broadcast message to everyone in the room (including sender to update their UI)
            io.to(bookingId).emit('receive_message', newMessage);
        } catch (error) {
            console.error('Error saving message via socket:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 User Disconnected: ${socket.id}`);
    });
});

// A simple test route
app.get('/', (req, res) => {
    res.send('EverythingBooking API is running!');
});

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port: ${PORT}`);
});
