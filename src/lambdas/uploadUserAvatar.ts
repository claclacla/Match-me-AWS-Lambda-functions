import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { connect as dynamoDBConnect } from '../repositories/dynamoDB/connect';
import { setUserAvatar, setUserProfileSectionStatus } from '../repositories/dynamoDB/users';

import { PROFILE_SECTION_STATUS } from "../types/ProfileSectionStatus";
import { PROFILE_SECTION_KEYS } from "../types/ProfileSectionKey";

import { uploadUserImage } from "../repositories/S3/users";

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

        const imageData = body.imageData;
        const contentType = body.contentType;

        const file = Buffer.from(imageData, 'base64');

        console.log("Uploading the user avatar...");

        const imageUrl: string = await uploadUserImage({ ownerId, file, contentType });

        console.log("Updating the user profile section status...");

        await setUserProfileSectionStatus({ dynamoDBClient, ownerId, section: PROFILE_SECTION_KEYS.AVATAR, value: PROFILE_SECTION_STATUS.COMPLETED });

        console.log("Updating the user avatar property...");

        await setUserAvatar({ dynamoDBClient, ownerId, avatar: imageUrl });

        return {
            statusCode: 200,
            body: JSON.stringify({ imageUrl })
        };
    } catch (err: any) {
        console.error("Upload failed", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error", error: err.message })
        };
    }
};
