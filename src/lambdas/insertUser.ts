import { v4 as uuidv4 } from 'uuid';

import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { UserDTO } from '../dtos/UserDTO';
import { UserEntity } from '../entities/UserEntity';

import { connect as openAIConnect } from '../openai/connect';
import { generateGroupBehavior } from '../openai/generateGroupBehavior';

import { connect as dynamoDBConnect } from '../repositories/dynamoDB/connect';
import { upsert as dynamoDBUpsert } from '../repositories/dynamoDB/users';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const dynamoDBClient: DynamoDBDocumentClient = dynamoDBConnect();
const openai = openAIConnect({ key: OPENAI_API_KEY });

async function insertUser({ userDTO, authenticatedUserId }: { userDTO: UserDTO, authenticatedUserId: string }) {
    try {
        console.log(`\nInserting new user: "${userDTO.name}"`);

        // 1. Generate the user's group behavior

        const groupBehavior: string = await generateGroupBehavior({ openai, insights: userDTO.insights });

        // 2. Create the user's entity 

        // TO DO: Add a parser from UserDTO to UserEntity

        const userEntity: UserEntity = {
            id: uuidv4(),
            ownerId: authenticatedUserId,
            name: userDTO.name,
            gender: userDTO.gender,
            location: userDTO.location,
            yearOfBirth: userDTO.yearOfBirth,
            insights: userDTO.insights,
            groupBehavior,
            isMatched: "false"
        };

        if (userDTO.match?.id) {
            userEntity.isMatched = "true";
            userEntity.match = {
                id: userDTO.match.id
            };
        }

        // 4. Upsert the vector into Pinecone

        await dynamoDBUpsert({ dynamoDBClient, users: [userEntity] });

        console.log(`Successfully inserted user ${userEntity.name} into DynamoDB.`);

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