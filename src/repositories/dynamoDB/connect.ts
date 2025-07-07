import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

interface ConnectProps {
    region: string,
    accessKeyId: string,
    secretAccessKey: string
}

interface DynamoDBClientProps {
    region?: string,
    credentials?: {
        accessKeyId: string,
        secretAccessKey: string
    }
}

export function connect(connectProps?: ConnectProps): DynamoDBDocumentClient {
    const dynamoDBClientProps: DynamoDBClientProps = {};

    if(connectProps) {
        dynamoDBClientProps.region = connectProps.region;
        dynamoDBClientProps.credentials = {
            accessKeyId: connectProps.accessKeyId,
            secretAccessKey: connectProps.secretAccessKey
        };
    }

    try {
        const client = new DynamoDBClient(dynamoDBClientProps);
        const dynamoDBClient: DynamoDBDocumentClient = DynamoDBDocumentClient.from(client);

        return dynamoDBClient;
    }
    catch (error: any) {
        console.error("DynamoDB connection error: DynamoDB client not initialized. Verify that your API key is set and your environment is properly configured.");
        throw new Error("DynamoDB connection error");
    }
}