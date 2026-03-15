import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            role: role || 'consumer'
        });

        await user.save();

        // Create JWT Payload
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // Sign the token
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret-token-key-change-me',
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id, name: user.name, email: user.email, role: user.role
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret-token-key-change-me',
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id, name: user.name, email: user.email, role: user.role
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

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

// @route   GET /api/auth/profile/:id
// @desc    Get public profile of a provider
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/auth/profile
// @desc    Update own profile (bio, avatar)
router.put('/profile', auth, async (req, res) => {
    try {
        const { bio, avatar } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (bio !== undefined) user.bio = bio;
        if (avatar !== undefined) user.avatar = avatar;
        await user.save();

        res.json({ message: 'Profile updated', user: { id: user.id, name: user.name, bio: user.bio, avatar: user.avatar } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
