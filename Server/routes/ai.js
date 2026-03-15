import express from 'express';
const router = express.Router();
import { OpenAI } from 'openai';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';

// Lazy initialization
let _groq = null;
const getGroqClient = () => {
    if (!_groq && process.env.GROQ_API_KEY) {
        _groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        });
    }
    return _groq;
};

// @route   POST /api/ai/optimize-listing
// @desc    Takes raw description and optimizes it into a professional sales pitch
router.post('/optimize-listing', async (req, res) => {
    const groq = getGroqClient();
    if (!groq) {
        return res.status(503).json({ error: 'Groq Service unconfigured. Please add GROQ_API_KEY to .env' });
    }
    try {
        const { rawDescription } = req.body;

        if (!rawDescription) {
            return res.status(400).json({ msg: 'Please provide a raw description.' });
        }

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an expert marketing copywriter for service providers. Polish the following raw description into a professional, trustworthy, and bulleted service listing. Keep it concise but persuasive."
                },
                {
                    role: "user",
                    content: rawDescription
                }
            ]
        });

        res.json({ optimizedText: response.choices[0].message.content });
    } catch (err) {
        console.error('Groq AI Error:', err.message);
        res.status(500).json({ error: 'Server Error optimizing text' });
    }
});

// @route   POST /api/ai/verify-job-completion
// @desc    Verifies job completion using Groq-Vision AI (Llama 3.2 Vision)
router.post('/verify-job-completion', async (req, res) => {
    const groq = getGroqClient();
    if (!groq) {
        return res.status(503).json({ error: 'Groq Service unconfigured' });
    }

    try {
        const { image, bookingId } = req.body; // image as base64

        if (!image || !bookingId) {
            return res.status(400).json({ msg: 'Image and bookingId are required' });
        }

        const booking = await Booking.findById(bookingId).populate('listingId');
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        const listing = booking.listingId;
        const prompt = `You are a practical job verification assistant. Your job is to confirm that a service provider has completed their work.

Service Category: ${listing.category || 'General'}
Service Name: ${listing.name}
Service Description: ${listing.description || 'No description provided'}

Look at this photo and determine: Does this photo show a genuine attempt at completing work related to this type of service? Be LENIENT and practical. 

- If the photo shows ANY real-world work scene, tools, products, or results that could REASONABLY relate to the service category, answer YES.
- Only answer NO if the photo is clearly unrelated (e.g., a selfie for a plumbing job, or a blank wall for a cleaning job).
- Do NOT be overly strict about the listing name — focus on the service CATEGORY and DESCRIPTION.

Answer with "YES" or "NO" followed by a brief one-line reason.`;

        const response = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${image}`,
                            },
                        },
                    ],
                },
            ],
        });

        const aiResult = response.choices[0].message.content;
        const reflectsSuccess = aiResult.toUpperCase().includes("YES");

        if (reflectsSuccess) {
            booking.status = 'completed';
            booking.isAiVerified = true;
            booking.verificationPhoto = 'Image stored locally (Base64)';
            await booking.save();
        }

        res.json({
            verified: reflectsSuccess,
            reasoning: aiResult,
            status: booking.status
        });

    } catch (err) {
        console.error('Groq Vision Error:', err.message);
        console.error('Full Error:', err.response?.data || err);
        res.status(500).json({ error: err.message || 'Server Error during vision verification' });
    }
});

export default router;
