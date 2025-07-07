import { v4 as uuidv4 } from 'uuid';

import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { UserDTO } from '../dtos/UserDTO';
import { UserEntity } from '../entities/UserEntity';

import { connect as dynamoDBConnect } from '../repositories/dynamoDB/connect';
import { getByOwnerId as dynamoDBGetByOwnerId } from '../repositories/dynamoDB/users';

const dynamoDBClient: DynamoDBDocumentClient = dynamoDBConnect();

export const handler = async (event: any) => {
    try {
        console.log("Received event:", JSON.stringify(event));

        // Extract Cognito user ID from JWT

        const authenticatedUserId = event.requestContext?.authorizer?.jwt?.claims?.sub;

        if (!authenticatedUserId) {
            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
            };
        }

        // Search by metadata.ownerId

        const userEntity: UserEntity | undefined = await dynamoDBGetByOwnerId({ dynamoDBClient, ownerId: authenticatedUserId });

        if (userEntity === undefined) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "User not found." }),
            };
        }

        // TO DO: Add a mapper to create the userDTO

        const userDTO: UserDTO = {
            id: userEntity.ownerId,
            name: userEntity.name,
            gender: userEntity.gender,
            location: userEntity.location,
            yearOfBirth: userEntity.yearOfBirth,
            insights: userEntity.insights,
            groupBehavior: userEntity.groupBehavior
        }

        if (userEntity.match?.id) {
            userDTO.match = {
                id: userEntity.match.id
            };
        }

        console.log("UserDTO: " + JSON.stringify(userDTO));

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user: userDTO
            }),
        };

    } catch (error: any) {
        console.error("Error in dynamoDBGetByOwnerId:", error);

        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Internal server error.",
                error: error.message || "Unknown error"
            }),
        };
    }
};