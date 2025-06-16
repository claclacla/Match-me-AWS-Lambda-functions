import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import { DATA, PINECONE } from "../../../config/config.json";
import usersDataset from '../../../../assets/users.json';

import { UserDTO } from '../../../dtos/UserDTO';
import { UserEntity } from '../../../entities/UserEntity';

import { connect as openAIConnect } from '../../../openai/connect';
import { generateTextEmbedding } from '../../../openai/generateTextEmbedding';

import { connect as pineconeConnect } from '../../../repositories/pinecone/connect';
import { upsert } from '../../../repositories/pinecone/upsert';

dotenv.config();

const PINECONE_KEY = process.env.PINECONE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (PINECONE_KEY === undefined || OPENAI_API_KEY === undefined) {
    process.exit(1);
}

const users: UserDTO[] = usersDataset as UserDTO[];

const pc = pineconeConnect({ key: PINECONE_KEY });
const usersIndex = pc.Index(PINECONE.INDEXES.USERS);

const openai = openAIConnect({ key: OPENAI_API_KEY });

async function fill() {
    try {
        console.log(`Creation of the index upsert "${PINECONE.INDEXES.USERS}"...`);

        const vectorsToUpsert: UserEntity[] = [];

        for (const user of users) {
            user.id = uuidv4();
            const embedding = await generateTextEmbedding({ openai, text: user.bio, dimension: DATA.EMBEDDING_DIMENSION });

            const userEntity: UserEntity = {
                id: user.id,
                values: embedding,
                metadata: {
                    name: user.name,
                    gender: user.gender,
                    location: user.location,
                    age: user.age,
                    bio: user.bio,
                },
            };

            vectorsToUpsert.push(userEntity);
        }

        console.log(`${vectorsToUpsert.length} vectors creation in the index "${PINECONE.INDEXES.USERS}"...`);

        await upsert({ index: usersIndex, vectors: vectorsToUpsert });

        console.log("Vectors created!");

    } catch (error: any) {
        console.error("Upsert error:", error.message || error);
    }
}

fill();