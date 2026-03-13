import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("Available models:");
        data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes("embedContent")) {
                console.log(`- ${m.name} (Embeddings)`);
            } else {
                console.log(`- ${m.name}`);
            }
        });
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
