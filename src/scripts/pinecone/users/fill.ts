import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Pinecone } from '@pinecone-database/pinecone';

import { DATA, PINECONE } from "../../../config/config.json";
import usersDataset from '../../../../assets/users.json';

import { UserDTO } from '../../../dtos/UserDTO';
import { UserEntity } from '../../../entities/UserEntity';

import { connect as openAIConnect } from '../../../openai/connect';
import { generateTextEmbedding } from '../../../openai/generateTextEmbedding';
import { generateUserNarrative } from '../../../openai/generateUserNarrative';

import { connect as pineconeConnect } from '../../../repositories/pinecone/connect';
import { upsert as pineconeUsersUpsert } from "../../../repositories/pinecone/users";

dotenv.config();

const PINECONE_KEY = process.env.PINECONE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (PINECONE_KEY === undefined || OPENAI_API_KEY === undefined) {
    process.exit(1);
}

const users: UserDTO[] = usersDataset as UserDTO[];

const pineconeClient: Pinecone = pineconeConnect({ key: PINECONE_KEY });

const openai = openAIConnect({ key: OPENAI_API_KEY });

async function fill() {
    try {
        console.log(`Creation of the index upsert "${PINECONE.INDEXES.USERS}"...`);

        const usersEntities: UserEntity[] = [];

        for (const user of users) {
            const narrative: string = await generateUserNarrative({ openai, insights: user.insights })

            user.id = uuidv4();
            const embedding = await generateTextEmbedding({
                openai,
                text: narrative,
                dimension: DATA.EMBEDDING_DIMENSION
            });

            const userEntity: UserEntity = {
                id: user.id,
                values: embedding,
                metadata: {
                    ownerId: uuidv4(),
                    name: user.name,
                    gender: user.gender,
                    location: user.location,
                    age: user.age,
                    insights: user.insights,
                    narrative: narrative,
                    matchId: ""
                },
            };

            usersEntities.push(userEntity);
        }

        console.log(`${usersEntities.length} vectors creation in the index "${PINECONE.INDEXES.USERS}"...`);

        await pineconeUsersUpsert({ pineconeClient, users: usersEntities });

        console.log("Vectors created!");

    } catch (error: any) {
        console.error("Upsert error:", error.message || error);
    }
}

fill();