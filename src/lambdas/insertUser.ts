import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { UserDTO } from '../dtos/UserDTO';
import { UserEntity } from '../entities/UserEntity';

import { connect as openAIConnect } from '../openai/connect';
import { generateGroupBehavior } from '../openai/generateGroupBehavior';

import { connect as dynamoDBConnect } from '../repositories/dynamoDB/connect';
import { upsert as dynamoDBUpsert } from '../repositories/dynamoDB/users';

import { mapUserDTOToUserEntity } from "../mappers/mapUserDTOToUserEntity";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const dynamoDBClient: DynamoDBDocumentClient = dynamoDBConnect();
const openai = openAIConnect({ key: OPENAI_API_KEY });

export const handler = async (event: any) => {
    try {
        console.log("Full Lambda event received:", JSON.stringify(event, null, 2));

        // Extract Authenticated User ID from API Gateway Authorizer 

        const ownerId = event.requestContext?.authorizer?.jwt?.claims?.sub;

        if (!ownerId) {
            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
            };
        }

        // Parse Request Body for User Data (for POST requests)
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

        // Set the userDTO id equal to the authentication service id

        userDTO.id = ownerId;

        // Generate the user's group behavior

        let groupBehavior = "";

        if (Array.isArray(userDTO.insights) && userDTO.insights.length > 0) {
            console.log("Generating the user's group behavior from the insights...");
            groupBehavior = await generateGroupBehavior({ openai, insights: userDTO.insights });
        }

        userDTO.groupBehavior = groupBehavior;

        // Create the user's entity 

        const userEntity: UserEntity = mapUserDTOToUserEntity({ userDTO });

        // Upsert the vector into Dynamo

        console.log("Inserting the user into the database...");

        await dynamoDBUpsert({ dynamoDBClient, users: [userEntity] });

        // Return API Gateway-compatible success response

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userDTO }),
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