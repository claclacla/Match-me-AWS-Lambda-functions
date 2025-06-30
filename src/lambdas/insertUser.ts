import { v4 as uuidv4 } from 'uuid';

import { DATA, PINECONE } from "../config/config.json";

import { connect as pineconeConnect } from '../repositories/pinecone/connect';
import { upsert } from '../repositories/pinecone/upsert';

import { connect as openAIConnect } from '../openai/connect';
import { generateTextEmbedding } from '../openai/generateTextEmbedding';
import { generateNarrative } from '../openai/generateNarrative';

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

async function insertUser({ userDTO, authenticatedUserId }: { userDTO: UserDTO, authenticatedUserId: string }) {
    try {
        console.log(`\nInserting new user: "${userDTO.name}"`);

/*
You are a personality analyst trained to interpret user narratives and behavioral insights for a friend-matching app.

You will receive a collection of structured inputs that may include question-and-answer pairs, freeform reflections, user behavior summaries, or personality tags.

Your task is to write a short, engaging, third-person description of the user, focusing on how they might relate to others. Use the information provided to infer values, social tendencies, and emotional tone.

Do not list or reference the original prompts or questions. Instead, synthesize the information into a warm, human description suitable for matching with others in a social context.
*/

        // 1. Generate the user's narrative

        const narrative: string = await generateNarrative({ openai, insights: userDTO.insights });
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
                narrative
            }
        }

        // 4. Upsert the vector into Pinecone

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