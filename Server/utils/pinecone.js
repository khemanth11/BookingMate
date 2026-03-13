import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

// Lazy client initialization
let _genAI = null;
let _pc = null;
let _index = null;

const getGeminiClient = () => {
    if (!_genAI && process.env.GEMINI_API_KEY) {
        _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return _genAI;
};

const getPineconeIndex = () => {
    if (!_index && process.env.PINECONE_API_KEY) {
        _pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        _index = _pc.index(process.env.PINECONE_INDEX_NAME || 'listings');
    }
    return _index;
};

/**
 * Generates an embedding for a given text using Google Gemini
 */
export const getEmbedding = async (text) => {
    const genAI = getGeminiClient();
    if (!genAI) {
        console.warn('GEMINI_API_KEY missing or not yet loaded.');
        return null;
    }
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent({
            content: { parts: [{ text: text }] },
            outputDimensionality: 1536
        });
        return result.embedding.values;
    } catch (error) {
        console.error('Gemini Embedding error:', error);
        return null;
    }
};

/**
 * Syncs a listing to Pinecone using Gemini embeddings (Hybrid Mode)
 */
export const syncListingToPinecone = async (listing) => {
    const genAI = getGeminiClient();
    const index = getPineconeIndex();
    
    if (!index || !genAI) {
        console.warn('Pinecone or Gemini not configured. Skipping sync.');
        return;
    }
    try {
        const textToEmbed = `${listing.name}. ${listing.category}. ${listing.description}`;
        const vector = await getEmbedding(textToEmbed);

        if (!vector) return;

        await index.upsert([{
            id: listing._id.toString(),
            values: vector,
            metadata: {
                name: listing.name,
                category: listing.category,
                price: listing.price
            }
        }]);
        console.log(`Synced listing ${listing._id} to Pinecone via Gemini Embeddings`);
    } catch (error) {
        console.error('Pinecone sync error:', error);
    }
};

/**
 * Deletes a listing from Pinecone
 */
export const deleteListingFromPinecone = async (listingId) => {
    const index = getPineconeIndex();
    if (!index) {
        console.warn('Pinecone not configured. Skipping delete.');
        return;
    }
    try {
        await index.deleteOne(listingId.toString());
        console.log(`Deleted listing ${listingId} from Pinecone`);
    } catch (error) {
        console.error('Pinecone delete error:', error);
    }
};

/**
 * Performs semantic search using Gemini embeddings
 */
export const semanticSearch = async (queryText, limit = 10) => {
    const genAI = getGeminiClient();
    const index = getPineconeIndex();
    
    if (!index || !genAI) {
        console.warn('Pinecone or Gemini not configured. Skipping search.');
        return [];
    }
    try {
        const queryVector = await getEmbedding(queryText);
        if (!queryVector) return [];

        const queryResponse = await index.query({
            vector: queryVector,
            topK: limit,
            includeMetadata: true,
        });

        console.log(`Semantic search for "${queryText}" found ${queryResponse.matches.length} initial matches.`);
        
        // Stricter filtering for very short queries like "hi" or "hello"
        const isVeryShort = queryText.length < 4;
        const threshold = isVeryShort ? 0.75 : 0.65; 

        const relevantMatches = queryResponse.matches.filter(match => {
            console.log(`- Match: ${match.metadata?.name || match.id}, Score: ${match.score.toFixed(4)}`);
            return match.score >= threshold;
        });

        if (relevantMatches.length === 0 && !isVeryShort) {
             console.log("No high-quality matches found. Showing top result as fallback if above 0.5.");
             if (queryResponse.matches[0]?.score > 0.5) {
                 return [queryResponse.matches[0].id];
             }
        }

        return relevantMatches.map(match => match.id);
    } catch (error) {
        console.error('Semantic search error:', error);
        return [];
    }
};
