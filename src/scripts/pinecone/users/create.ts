import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config();

const PINECONE_KEY = process.env.PINECONE_KEY;

if (PINECONE_KEY === undefined) {
    process.exit(1);
}

const INDEX_NAME: string = 'users';
const EMBEDDING_DIMENSION = 1536; // text-embedding-3-small dimension

const pc = new Pinecone({
    apiKey: PINECONE_KEY
});

async function create() {
    try {
        console.log(`Check if "${INDEX_NAME}" exists...`);

        const indexList = await pc.listIndexes();

        if (indexList.indexes === undefined) {
            return;
        }

        const indexExists = indexList.indexes.some(index => index.name === INDEX_NAME);

        if (!indexExists) {
            console.log(`Creation of the index: "${INDEX_NAME}"...`);

            await pc.createIndex({
                name: INDEX_NAME,
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1',
                    }
                },
                dimension: EMBEDDING_DIMENSION,
                metric: 'cosine',
            });

            console.log(`Index "${INDEX_NAME}" created!`);

            console.log("Waiting for the index creation...");
            await new Promise(resolve => setTimeout(resolve, 3000)); 
        } else {
            console.log(`The index"${INDEX_NAME}" already exists!`);
        }
    } catch (error: any) {
        console.error("Error:", error.message || error);
        process.exit(1);
    }
}

create();