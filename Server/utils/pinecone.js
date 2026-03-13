const { OpenAI } = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(process.env.PINECONE_INDEX_NAME || 'listings');

/**
 * Generates an embedding for a given text
 */
const getEmbedding = async (text) => {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Embedding error:', error);
        return null;
    }
};

/**
 * Syncs a listing to Pinecone
 */
const syncListingToPinecone = async (listing) => {
    try {
        // Construct the text to embed
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
        console.log(`Synced listing ${listing._id} to Pinecone`);
    } catch (error) {
        console.error('Pinecone sync error:', error);
    }
};

/**
 * Deletes a listing from Pinecone
 */
const deleteListingFromPinecone = async (listingId) => {
    try {
        await index.deleteOne(listingId.toString());
        console.log(`Deleted listing ${listingId} from Pinecone`);
    } catch (error) {
        console.error('Pinecone delete error:', error);
    }
};

/**
 * Performs semantic search
 */
const semanticSearch = async (queryText, limit = 10) => {
    try {
        const queryVector = await getEmbedding(queryText);
        if (!queryVector) return [];

        const queryResponse = await index.query({
            vector: queryVector,
            topK: limit,
            includeMetadata: true,
        });

        return queryResponse.matches.map(match => match.id);
    } catch (error) {
        console.error('Semantic search error:', error);
        return [];
    }
};

module.exports = {
    syncListingToPinecone,
    deleteListingFromPinecone,
    semanticSearch
};
