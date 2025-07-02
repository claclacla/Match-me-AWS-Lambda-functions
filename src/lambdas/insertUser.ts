import { v4 as uuidv4 } from 'uuid';
import { Pinecone } from '@pinecone-database/pinecone';

import { DATA } from "../config/config.json";

import { connect as pineconeConnect } from '../repositories/pinecone/connect';
import { upsert as pineconeUsersUpsert } from "../repositories/pinecone/users";

import { connect as openAIConnect } from '../openai/connect';
import { generateTextEmbedding } from '../openai/generateTextEmbedding';
import { generateUserNarrative } from '../openai/generateUserNarrative';

import { UserEntity } from "src/entities/UserEntity";
import { UserDTO } from 'src/dtos/UserDTO';

const PINECONE_KEY = process.env.PINECONE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!PINECONE_KEY || !OPENAI_API_KEY) {
    console.error("Missing environment variables: PINECONE_KEY or OPENAI_API_KEY.");
    throw new Error("Missing API keys configuration.");
}

const pineconeClient: Pinecone = pineconeConnect({ key: PINECONE_KEY });

const openai = openAIConnect({ key: OPENAI_API_KEY });

async function insertUser({ userDTO, authenticatedUserId }: { userDTO: UserDTO, authenticatedUserId: string }) {
    try {
        console.log(`\nInserting new user: "${userDTO.name}"`);

        // 1. Generate the user's narrative

        const narrative: string = await generateUserNarrative({ openai, insights: userDTO.insights });
        console.log(narrative);

        // 2. Generate embedding from the user's narrative

        const embedding = await generateTextEmbedding({ 
            openai, 
            text: narrative, 
            dimension: DATA.EMBEDDING_DIMENSION 
        });

        // 3. Create the entity and the user creation prompt

        // TO DO: Add a parser from UserDTO to UserEntity

        const userEntity: UserEntity = {
            id: uuidv4(),
            values: embedding,
            metadata: {
                ownerId: authenticatedUserId,
                name: userDTO.name,
                gender: userDTO.gender,
                location: userDTO.location,
                age: userDTO.age,
                insights: userDTO.insights,
                narrative,
                matchId: ""
            }
        }

        if(userDTO.match?.id) {
            userEntity.metadata.matchId = userDTO.match.id;
        }

        // 4. Upsert the vector into Pinecone

        await pineconeUsersUpsert({ pineconeClient, users: [userEntity] });

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

        console.log(`Received user data - name: ${userDTO.name}`);

        // 3. Call your core logic function to insert the user

        const result = await insertUser({ userDTO, authenticatedUserId });

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