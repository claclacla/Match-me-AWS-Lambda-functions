import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { connect as dynamoDBConnect } from '../repositories/dynamoDB/connect';
import { setUserGroupPersonalExperience } from '../repositories/dynamoDB/users';

const dynamoDBClient: DynamoDBDocumentClient = dynamoDBConnect();

export const handler = async (event: any) => {
    const ownerId = event.pathParameters?.id;

    if (!ownerId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing user ID in path." }),
        };
    }

    if (!event.body) {
        console.warn('Request body is empty');
        return { statusCode: 400, body: JSON.stringify({ message: 'Request body is empty' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { personalExperience } = body;

        if (!personalExperience || typeof personalExperience !== 'string') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing or invalid personalExperience field. It must be a string.' }),
            };
        }

        if (personalExperience.trim().length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'personalExperience cannot be empty.' }),
            };
        }

        await setUserGroupPersonalExperience({ dynamoDBClient, ownerId, personalExperience });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupPersonalExperience: personalExperience }),
        };
    } catch (error: any) {
        console.error('Error processing text-based personal experience:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
        };
    }
};

