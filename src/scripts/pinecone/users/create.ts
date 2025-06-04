import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

import { PINECONE, DATA } from "../../../config/config.json";

dotenv.config();

const PINECONE_KEY = process.env.PINECONE_KEY;

if (PINECONE_KEY === undefined) {
    process.exit(1);
}

const pc = new Pinecone({
    apiKey: PINECONE_KEY
});

async function create() {
    try {
        console.log(`Check if "${PINECONE.INDEXES.USERS}" exists...`);

        const indexList = await pc.listIndexes();

        if (indexList.indexes === undefined) {
            return;
        }

        const indexExists = indexList.indexes.some(index => index.name === PINECONE.INDEXES.USERS);

        if (!indexExists) {
            console.log(`Creation of the index: "${PINECONE.INDEXES.USERS}"...`);

            await pc.createIndex({
                name: PINECONE.INDEXES.USERS,
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1',
                    }
                },
                dimension: DATA.EMBEDDING_DIMENSION,
                metric: 'cosine',
            });

            console.log(`Index "${PINECONE.INDEXES.USERS}" created!`);

            console.log("Waiting for the index creation...");
            await new Promise(resolve => setTimeout(resolve, 3000)); 
        } else {
            console.log(`The index"${PINECONE.INDEXES.USERS}" already exists!`);
        }
    } catch (error: any) {
        console.error("Error:", error.message || error);
        process.exit(1);
    }
}

create();