import * as dotenv from 'dotenv';
import { RecordMetadata, ScoredPineconeRecord } from '@pinecone-database/pinecone';

import { DATA } from "../../../config/config.json";

import { connect as pineconeConnect } from '../../../repositories/pinecone/connect';
import { query as pineconeUsersQuery } from "../../../repositories/pinecone/users";

import { UserEntity } from '../../../entities/UserEntity';
import { mapPineconeUserRecordToUserEntity } from '../../../mappers/mapPineconeUserRecordToUserEntity';

import { connect as openAIConnect } from '../../../openai/connect';
import { generateIdealMatchProfile } from '../../../openai/generateIdealMatchProfile';
import { generateTextEmbedding } from '../../../openai/generateTextEmbedding';

dotenv.config();

const PINECONE_KEY = process.env.PINECONE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (PINECONE_KEY === undefined || OPENAI_API_KEY === undefined) {
    process.exit(1);
}

const pineconeClient = pineconeConnect({ key: PINECONE_KEY });
const openai = openAIConnect({ key: OPENAI_API_KEY });

async function matchUsers() {

    // 1. Get the unmatched users

    const queryResult = await pineconeUsersQuery({
        pineconeClient,
        filter: {
            "matchId": ""
        },
        limit: 5
    });

    const resultMatches = queryResult?.matches;

    if (resultMatches === undefined || resultMatches.length === 0) {
        console.log("All users are matched!");
        return;
    }

    const userEntities: UserEntity[] = resultMatches.map((pineconeUserRecord: ScoredPineconeRecord<RecordMetadata>) => mapPineconeUserRecordToUserEntity({ pineconeUserRecord }));

    console.log(userEntities);

    // Parse users

    for (const userEntity of userEntities) {

        // 2. Generate ideal match profile

        console.log("\nGenerating ideal match for:", userEntity.metadata.name);
        console.log("Narrative:", userEntity.metadata.narrative);

        const matchDescription: string = await generateIdealMatchProfile({ openai, narrative: userEntity.metadata.narrative });

        // 3. Generate the match description embedding(the vector)

        const embedding = await generateTextEmbedding({
            openai,
            text: matchDescription,
            dimension: DATA.EMBEDDING_DIMENSION
        });

        console.log("\nEmbedding generated!\n");

        // 4. Ask for the closest match to Pinecone

        const matchQueryResult = await pineconeUsersQuery({
            pineconeClient,
            vector: embedding,
            filter: {
                "matchId": "",
                "ownerId": { $ne: userEntity.metadata.ownerId }
            }
        });

        const pineconeUserRecord = matchQueryResult?.matches[0];

        if (pineconeUserRecord === undefined) {
            console.log("All users are matched!");
            return;
        }

        const matchUserEntity: UserEntity = mapPineconeUserRecordToUserEntity({ pineconeUserRecord });

        console.log(matchUserEntity);
    }
}

matchUsers();