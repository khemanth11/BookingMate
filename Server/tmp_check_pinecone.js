import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

async function checkIndex() {
    try {
        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        const indexName = process.env.PINECONE_INDEX_NAME || 'listings';
        const description = await pc.describeIndex(indexName);
        console.log("Index Configuration:");
        console.log(JSON.stringify(description, null, 2));
    } catch (e) {
        console.error("Error checking index:", e);
    }
}

checkIndex();
