import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { connect as openAIConnect } from '../openai/connect';
import { generateGroupBehavior } from '../openai/generateGroupBehavior';

import { connect as dynamoDBConnect } from '../repositories/dynamoDB/connect';
import { setUserGroupBehavior } from '../repositories/dynamoDB/users';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const dynamoDBClient: DynamoDBDocumentClient = dynamoDBConnect();
const openai = openAIConnect({ key: OPENAI_API_KEY });

export const handler = async (event: any) => {
    try {
        const ownerId = event.pathParameters?.id;

        if (!ownerId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing user ID in path." }),
            };
        }

        const body = JSON.parse(event.body);
        const insights: string[] = body.insights;

        if (!Array.isArray(insights) || insights.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing or invalid insights array in body." }),
            };
        }

        const groupBehavior = await generateGroupBehavior({ openai, insights });

        console.log("User's group behavior: ", groupBehavior);

        await setUserGroupBehavior({ dynamoDBClient, ownerId, insights, groupBehavior });

        return {
            statusCode: 200,
            body: JSON.stringify({ groupBehavior }),
        };

    } catch (err: any) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error", error: err.message }),
        };
    }
};