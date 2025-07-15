import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { connect as dynamoDBConnect } from '../repositories/dynamoDB/connect';
import { setUserProfileSectionStatus } from '../repositories/dynamoDB/users';

import { PROFILE_SECTION_STATUS } from "../types/ProfileSectionStatus";
import { PROFILE_SECTION_KEYS } from "../types/ProfileSectionKey";

const dynamoDBClient: DynamoDBDocumentClient = dynamoDBConnect();

export const handler = async (event: any) => {
    try {
        const ownerId = event.pathParameters?.id;

        if (!ownerId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing user ID in path." }),
            };
        }

        let body;

        try {
            body = JSON.parse(event.body || '{}');
        } catch {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid JSON in request body." }),
            };
        }

        const section = body.section;
        const value = body.value;

        const allowedSections = Object.values(PROFILE_SECTION_KEYS);

        if (section === undefined || !allowedSections.includes(section)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `Invalid section: ${section}` }),
            };
        }

        const allowedValues = Object.values(PROFILE_SECTION_STATUS);

        if (value === undefined || !allowedValues.includes(value)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `Invalid value: ${value}` }),
            };
        }

        console.log("User's profile section: ", section, " - Value: ", value);

        await setUserProfileSectionStatus({ dynamoDBClient, ownerId, section, value });

        return {
            statusCode: 200,
            body: JSON.stringify({
                section,
                value
            }),
        };

    } catch (err: any) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error", error: err.message }),
        };
    }
};