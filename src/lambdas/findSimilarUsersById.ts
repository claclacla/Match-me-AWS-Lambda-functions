/*
import { PINECONE } from "../config/config.json";

import { connect as pineconeConnect } from '../repositories/pinecone/connect';
import { getByIds } from '../repositories/pinecone/getByIds';
import { query } from '../repositories/pinecone/query';

const PINECONE_KEY = process.env.PINECONE_KEY;

console.log("PINECONE_KEY: " + PINECONE_KEY);

if (!PINECONE_KEY) {
    console.error("Missing environment variables: PINECONE_KEY or OPENAI_API_KEY.");

    throw new Error("Missing API keys configuration.");
}

const pc = pineconeConnect({ key: PINECONE_KEY });
const usersIndex = pc.Index(PINECONE.INDEXES.USERS);

async function findSimilarUsersById({ targetId, topK } : { targetId: string, topK: number }) {
    try {
        //console.log(`\nLooking for similar users by id: "${targetId}" for owner: "${authenticatedUserId}"`);

        // 1. Fetch the target vector from Pinecone by ID

        const fetchResult = await getByIds({ index: usersIndex, ids: [targetId] });

        if (!fetchResult.records || Object.keys(fetchResult.records).length === 0) {
            console.warn(`Attention: The required vector doesn't exist for ID: ${targetId}.`);
            return [];
        }

        const targetVector = fetchResult.records[targetId];

        // 2. Validate the fetched vector and its ownership

        if (!targetVector || !targetVector.values) {
            console.error(`Error: the required vector doesn't contain any value for ID: ${targetId}.`);
            return [];
        }

        // TO DO: add the authenticatedUserId metadata to the Pinecone data and uncomment the following lines
        // AND the "filter" parameter in the query below

        *
        if (targetVector.metadata?.ownerId !== authenticatedUserId) {
            console.warn(`Unauthorized access: User ${authenticatedUserId} attempted to access vector ${targetId} owned by ${targetVector.metadata?.ownerId}.`);
            // You might want to throw an error or return a specific response here depending on security policy
            throw new Error("Unauthorized: Access to target vector denied.");
        }
        *

        const queryVector = targetVector.values;

        // 3. Query Pinecone for similar vectors, applying ownerId filter

        const queryResult = await query({
            index: usersIndex,
            params: {
                vector: queryVector,
                topK: topK + 1, // Fetch one more to potentially exclude the target itself
                includeMetadata: true,
                //filter: {
                //    ownerId: { '$eq': authenticatedUserId }, // Filter by the authenticated user's ID
                //},
            },
        });

        //console.log(`\nResults for "${targetId}" (Top ${topK}) for owner ${authenticatedUserId}:`);

        const similarUsers = [];

        if (queryResult.matches && queryResult.matches.length > 0) {
            for (const match of queryResult.matches) {

                if (match.id !== targetId && similarUsers.length < topK) {
                    const similarityScore = match.score !== undefined ? parseFloat(match.score.toFixed(4)) : 'N/A';
                    similarUsers.push({
                        id: match.id,
                        name: match.metadata?.name || 'Unknown',
                        bio: match.metadata?.bio || 'N/A',
                        similarityScore: similarityScore,
                    });
                }
            }
            if (similarUsers.length === 0) {
                console.log("No similar users found after filtering!");
            }
        } else {
            console.log("No results found from Pinecone query!");
        }

        return similarUsers;
    } catch (error: any) {
        console.error("Error during findSimilarUsersByIdAndFilter:", error.message || error);

        if (error.response && error.response.data) {
            console.error("Error details:", error.response.data);
        }

        throw error; 
    }
}

export const handler = async (event: any) => {
    try {
        console.log("Full Lambda event received:", JSON.stringify(event, null, 2));

        // 1. Extract Authenticated User ID from API Gateway Authorizer 
        const authenticatedUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;

        if (!authenticatedUserId) {

            // This should not happen if Cognito Authorizer is correctly configured

            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
            };
        }

        // 2. Extract Query Parameters from GET Request

        const targetId = event.queryStringParameters?.targetId; // Assuming you'll pass the ID to search for
        const topK = parseInt(event.queryStringParameters?.topK || '2'); // Default to 2 if not provided

        if (!targetId) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Bad Request: 'targetId' query parameter is required." }),
            };
        }

        console.log("targetId: " + targetId, " - topK: " + topK);

        // 3. Call your core logic function

        const results = await findSimilarUsersById({ targetId, topK });

        // 4. Return API Gateway-compatible success response

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(results),
        };

    } catch (error: any) {
        console.error("Error in Lambda handler:", error);

        // 5. Return API Gateway-compatible error response
        // Provide more specific error for Unauthorized access

        if (error.message === "Unauthorized: Access to target vector denied.") {
            return {
                statusCode: 403, // 403 Forbidden for unauthorized access to specific data
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: error.message }),
            };
        }

        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Internal server error.", error: error.message || "Unknown error" }),
        };
    }
};
*/