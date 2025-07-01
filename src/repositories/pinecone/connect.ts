import { Pinecone } from '@pinecone-database/pinecone';

export function connect({ key }: { key: string }): Pinecone {
    try {
        const pineconeClient = new Pinecone({
            apiKey: key
        });

        return pineconeClient;
    }
    catch (error: any) {
        console.error("Pinecone connection error: Pinecone client not initialized. Verify that your API key is set and your environment is properly configured.");
        throw new Error("Pinecone connection error");
    }
}