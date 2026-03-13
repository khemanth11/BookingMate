const express = require('express');
const Listing = require('../models/Listing');
const jwt = require('jsonwebtoken');
const { syncListingToPinecone, deleteListingFromPinecone, semanticSearch } = require('../utils/pinecone');

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

// GET all listings (public)
router.get('/', async (req, res) => {
    try {
        const listings = await Listing.find().populate('providerId', 'name phone');
        res.json(listings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/listings/semantic-search
// @desc    Perform natural language search using Pinecone embeddings
// @access  Public
router.post('/semantic-search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ msg: 'No query provided' });

        const matchingIds = await semanticSearch(query);
        if (matchingIds.length === 0) return res.json([]);

        // Fetch listings from Mongo that match the IDs from Pinecone
        // We use $in and also preserve the order if possible, but simplified for now:
        const listings = await Listing.find({ _id: { $in: matchingIds } }).populate('providerId', 'name phone');
        
        // Re-order listings based on Pinecone score order
        const orderedListings = matchingIds
            .map(id => listings.find(l => l._id.toString() === id.toString()))
            .filter(l => l !== undefined);

        res.json(orderedListings);
    } catch (err) {
        console.error('Semantic Search Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// GET listings by category
router.get('/category/:category', async (req, res) => {
    try {
        const listings = await Listing.find({ category: req.params.category }).populate('providerId', 'name phone');
        res.json(listings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET provider's own listings
router.get('/me', auth, async (req, res) => {
    try {
        const listings = await Listing.find({ providerId: req.user.id });
        res.json(listings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// CREATE a new listing
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can create listings' });
    }

    try {
        const { name, category, price, description, available, location } = req.body;

        const newListing = new Listing({
            providerId: req.user.id,
            name,
            category,
            price,
            description,
            available,
            location
        });

        const listing = await newListing.save();
        
        // Background sync to Pinecone (don't await for faster response if you prefer, but here we do to be safe or just catch)
        syncListingToPinecone(listing).catch(err => console.error('Initial sync error:', err));

        res.json(listing);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// UPDATE a listing
router.put('/:id', auth, async (req, res) => {
    try {
        let listing = await Listing.findById(req.params.id);

        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        // Make sure user owns listing
        if (listing.providerId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { name, category, price, description, available, location } = req.body;

        if (name) listing.name = name;
        if (category) listing.category = category;
        if (price) listing.price = price;
        if (description !== undefined) listing.description = description;
        if (available !== undefined) listing.available = available;
        if (location) {
            if (location.latitude) listing.location.latitude = location.latitude;
            if (location.longitude) listing.location.longitude = location.longitude;
            if (location.address) listing.location.address = location.address;
        }

        await listing.save();

        // Sync update to Pinecone
        syncListingToPinecone(listing).catch(err => console.error('Update sync error:', err));

        res.json(listing);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE a listing
router.delete('/:id', auth, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        // Make sure user owns listing
        if (listing.providerId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Listing.findByIdAndDelete(req.params.id);

        // Delete from Pinecone
        deleteListingFromPinecone(req.params.id).catch(err => console.error('Delete sync error:', err));

        res.json({ message: 'Listing removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
