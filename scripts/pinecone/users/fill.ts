import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import OpenAI from "openai";
import usersDataset from '../../../assets/users.json';

dotenv.config();

const PINECONE_KEY = process.env.PINECONE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (PINECONE_KEY === undefined || OPENAI_API_KEY === undefined) {
    process.exit(1);
}

const INDEX_NAME: string = 'users';
const EMBEDDING_DIMENSION = 1536; // text-embedding-3-small dimension

interface UserData {
    id: string;
    name: string;
    bio: string;
}

const users: UserData[] = usersDataset as UserData[];

const pc = new Pinecone({
    apiKey: PINECONE_KEY
});

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
    console.log(`Embedding generation for: "${text.substring(0, Math.min(text.length, 50))}..."`);

    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            // dimensions: 512, 
        });

        const embedding = response.data[0].embedding;

        if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
            throw new Error(`Wrong embedding dimension. Needed: ${EMBEDDING_DIMENSION}, Current: ${embedding ? embedding.length : 'N/A'}`);
        }

        return embedding;

    } catch (error: any) {
        console.error("Generation error:", error.message || error);

        if (error.response && error.response.data) {
            console.error("OpenAI error:", error.response.data);
        }
        
        throw new Error(`Error on embedding generation for the index: ${text.substring(0, 50)}...`);
    }
}

async function fillPineconeIndex() {
    try {
        console.log(`Creation of the index upsert "${INDEX_NAME}"...`);

        const index = pc.Index(INDEX_NAME);

        const vectorsToUpsert = [];

        for (const user of users) {
            const embedding = await generateEmbedding(user.bio);

            //console.log(JSON.stringify(embedding));

            vectorsToUpsert.push({
                id: user.id,
                values: embedding,
                metadata: {
                    name: user.name,
                    bio: user.bio,
                },
            });
        }

        console.log(`${vectorsToUpsert.length} vectors creation in the index "${INDEX_NAME}"...`);

        await index.upsert(vectorsToUpsert);

        console.log("Vectors created!");

    } catch (error: any) {
        console.error("Upsert error:", error.message || error);
    }
}

fillPineconeIndex();