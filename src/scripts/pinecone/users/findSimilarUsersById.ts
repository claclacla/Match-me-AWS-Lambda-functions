import * as dotenv from 'dotenv';

import { PINECONE } from "../../../config/config.json";

import { connect as pineconeConnect } from '../../../repositories/pinecone/connect';
import { getByIds } from '../../../repositories/pinecone/getByIds';
import { query } from '../../../repositories/pinecone/query';

dotenv.config();

const PINECONE_KEY = process.env.PINECONE_KEY;

if (PINECONE_KEY === undefined) {
    process.exit(1);
}

const pc = pineconeConnect({ key: PINECONE_KEY });
const usersIndex = pc.Index(PINECONE.INDEXES.USERS);

async function findSimilarUsersById(targetId: string, topK: number = 2) {
    try {
        console.log(`\nLooking for similar users by id: "${targetId}"`);

        const fetchResult = await getByIds({ index: usersIndex, ids: [targetId] });

        if (!fetchResult.records || Object.keys(fetchResult.records).length === 0) {
            console.warn(`Attention: The required vector doesn't exist. Id: ${targetId}.`);
            return;
        }

        const targetVector = fetchResult.records[targetId];

        if (!targetVector || !targetVector.values) {
            console.error(`Error: the required vector doesn't contain any value. Id: ${targetId}.`);
            return;
        }

        const queryVector = targetVector.values;

        const queryResult = await query({
            index: usersIndex,
            params: {
                vector: queryVector,
                topK: topK + 1,
                includeMetadata: true
            }
        });

        console.log(`\nResults for "${targetId}" (Top ${topK}):`);

        if (queryResult.matches && queryResult.matches.length > 0) {
            let foundSimilarUsers = 0;

            for (const match of queryResult.matches) {
                if (match.id !== targetId) {
                    const similarityScore = match.score !== undefined ? match.score.toFixed(4) : 'N/A';

                    console.log(`---`);
                    console.log(`ID Utente (simile): ${match.id}`);
                    console.log(`Nome: ${match.metadata?.name || 'Sconosciuto'}`);
                    console.log(`Bio: ${match.metadata?.bio || 'N/A'}`);
                    console.log(`Punteggio di Similarità: ${similarityScore}`);

                    foundSimilarUsers++;

                    if (foundSimilarUsers >= topK) {
                        break;
                    }
                }
            }

            if (foundSimilarUsers === 0) {
                console.log("No users found!");
            }

        } else {
            console.log("No results found!");
        }
    } catch (error: any) {
        console.error("Error:", error.message || error);
        if (error.response && error.response.data) {
            console.error("Error details:", error.response.data);
        }
    }
}

(async () => {
    await findSimilarUsersById('user_002', 2);
})();