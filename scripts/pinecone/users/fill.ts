import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import OpenAI from "openai";
import usersDataset from '../../../assets/users.json';

import { UserDTO } from '../../dtos/UserDTO';
import { UserEntity } from '../../entities/UserEntity';

import { generateEmbedding } from '../../openai/generateEmbedding';

dotenv.config();

const PINECONE_KEY = process.env.PINECONE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (PINECONE_KEY === undefined || OPENAI_API_KEY === undefined) {
    process.exit(1);
}

const INDEX_NAME: string = 'users';
const EMBEDDING_DIMENSION = 1536; // text-embedding-3-small dimension

const users: UserDTO[] = usersDataset as UserDTO[];

const pc = new Pinecone({
    apiKey: PINECONE_KEY
});

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

async function fillPineconeIndex() {
    try {
        console.log(`Creation of the index upsert "${INDEX_NAME}"...`);

        const index = pc.Index(INDEX_NAME);

        const vectorsToUpsert = [];

        for (const user of users) {
            const embedding = await generateEmbedding({openai, text: user.bio, dimension: EMBEDDING_DIMENSION});

            const userEntity: UserEntity = {
                id: user.id,
                values: embedding,
                metadata: {
                    name: user.name,
                    bio: user.bio,
                },
            };

            vectorsToUpsert.push(userEntity);
        }

        console.log(`${vectorsToUpsert.length} vectors creation in the index "${INDEX_NAME}"...`);

        await index.upsert(vectorsToUpsert);

        console.log("Vectors created!");

    } catch (error: any) {
        console.error("Upsert error:", error.message || error);
    }
}

fillPineconeIndex();