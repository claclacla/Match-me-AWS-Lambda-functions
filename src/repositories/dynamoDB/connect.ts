import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

export function connect({ region, accessKeyId, secretAccessKey }: { region: string, accessKeyId: string, secretAccessKey: string }): DynamoDBDocumentClient {
    try {
        const client = new DynamoDBClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey
            }
        });

        const dynamoDBClient: DynamoDBDocumentClient = DynamoDBDocumentClient.from(client);

        return dynamoDBClient;
    }
    catch(error: any) {
        console.error("DynamoDB connection error: DynamoDB client not initialized. Verify that your API key is set and your environment is properly configured.");
        throw new Error("DynamoDB connection error");
    }
}