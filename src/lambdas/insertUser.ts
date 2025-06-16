import { v4 as uuidv4 } from 'uuid';

import { DATA, PINECONE } from "../config/config.json";

import { connect as pineconeConnect } from '../repositories/pinecone/connect';
import { upsert } from '../repositories/pinecone/upsert';

import { connect as openAIConnect } from '../openai/connect';
import { generateTextEmbedding } from '../openai/generateTextEmbedding';
import { UserEntity } from "src/entities/UserEntity";
import { UserDTO } from 'src/dtos/UserDTO';

const PINECONE_KEY = process.env.PINECONE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!PINECONE_KEY || !OPENAI_API_KEY) {
    console.error("Missing environment variables: PINECONE_KEY or OPENAI_API_KEY.");
    throw new Error("Missing API keys configuration.");
}

const pc = pineconeConnect({ key: PINECONE_KEY });
const usersIndex = pc.Index(PINECONE.INDEXES.USERS);

const openai = openAIConnect({ key: OPENAI_API_KEY });

/**
 * Inserts a new user into Pinecone after generating an embedding for their profile data.
 *
 * @param userId The unique ID of the user.
 * @param name The user's name.
 * @param bio The user's biography/description (used for embedding).
 * @param authenticatedUserId The ID of the user performing the operation (for ownership metadata).
 */

async function insertUser(userEntity: UserEntity, authenticatedUserId: string) {
    try {
        console.log(`\nInserting new user: "${userEntity.metadata.name}"`);

        // 1. Generate embedding from the user's bio

        const userVectorValues = await generateTextEmbedding({ openai, text: userEntity.metadata.bio, dimension: DATA.EMBEDDING_DIMENSION });

        userEntity.values = userVectorValues;

        // 2. Upsert the vector into Pinecone

        await upsert({
            index: usersIndex,
            vectors: [userEntity],
        });

        console.log(`Successfully inserted user ${userEntity.metadata.name} into Pinecone.`);

        return { success: true };

    } catch (error: any) {
        console.error("Error during insertUser:", error.message || error);
        if (error.response && error.response.data) {
            console.error("Error details:", error.response.data);
        }
        throw error; // Re-throw to be caught by the main handler
    }
}

/**
 * Main Lambda handler function.
 * This function is invoked by AWS Lambda.
 * It expects 'userId', 'name', and 'bio' in the request body (for POST requests).
 */

export const handler = async (event: any) => {
    try {
        console.log("Full Lambda event received:", JSON.stringify(event, null, 2));

        // 1. Extract Authenticated User ID from API Gateway Authorizer 

        const authenticatedUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;

        if (!authenticatedUserId) {
            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
            };
        }

        // 2. Parse Request Body for User Data (for POST requests)
        // TO DO: Add a function to check the body properties and create the userDTO

        let userDTO: UserDTO;

        try {
            userDTO = JSON.parse(event.body);
            console.log("Request body: " + userDTO);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Bad Request: Invalid JSON body." }),
            };
        }

        /*
        if (!userDTO.name) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Bad Request: 'name' are required in the request body." }),
            };
        }
        */

        // TO DO: Add a parser from UserDTO to UserEntity

        const userEntity: UserEntity = {
            id: uuidv4(),
            values: [],
            metadata: {
                ownerId: authenticatedUserId,
                name: userDTO.name,
                gender: userDTO.gender,
                location: userDTO.location,
                age: userDTO.age,
                bio: userDTO.bio
            }
        }

        console.log(`Received user data - name: ${userEntity.metadata.name}`);

        // 3. Call your core logic function to insert the user

        const result = await insertUser(userEntity, authenticatedUserId);

        // 4. Return API Gateway-compatible success response

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
        };

    } catch (error: any) {
        console.error("Error in Lambda handler:", error);

        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Internal server error.", error: error.message || "Unknown error" }),
        };
    }
};