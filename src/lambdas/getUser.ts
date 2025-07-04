import { connect as pineconeConnect } from '../repositories/pinecone/connect';
import { query as pineconeUsersQuery } from "../repositories/pinecone/users";

import { UserDTO, UserGender } from "../dtos/UserDTO";

const PINECONE_KEY = process.env.PINECONE_KEY;

if (!PINECONE_KEY) {
    console.error("Missing environment variable: PINECONE_KEY");
    throw new Error("Missing PINECONE_KEY");
}

const pineconeClient = pineconeConnect({ key: PINECONE_KEY });

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

        const queryResult = await pineconeUsersQuery({
            pineconeClient, filter: {
                "ownerId": { "$eq": authenticatedUserId }
            }
        });

        const match = queryResult?.matches?.[0];

        if (match === undefined || match.metadata === undefined) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "User not found." }),
            };
        }

        // TO DO: Add a mapper to create the userDTO

        const userDTO: UserDTO = {
            id: match.metadata.ownerId as string,
            name: match.metadata.name as string,
            gender: match.metadata.gender as UserGender,
            location: match.metadata.location as string,
            age: match.metadata.age as number,
            insights: match.metadata.insights as string[],
            narrative: match.metadata.narrative as string
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
        console.error("Error in getUserByOwnerId:", error);

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
