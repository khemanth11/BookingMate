const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

// Note: Ensure OPENAI_API_KEY is defined in Server/.env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// @route   POST /api/ai/optimize-listing
// @desc    Takes raw description and optimizes it into a professional sales pitch
// @access  Private (but for now we'll keep it simple, maybe add auth middleware later if needed)
router.post('/optimize-listing', async (req, res) => {
    try {
        const { rawDescription } = req.body;

        if (!rawDescription) {
            return res.status(400).json({ msg: 'Please provide a raw description.' });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
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
        console.error('AI Error:', err.message);
        res.status(500).json({ error: 'Server Error optimizing text' });
    }
});

module.exports = router;
