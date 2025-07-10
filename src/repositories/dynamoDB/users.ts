import { DynamoDBDocumentClient, BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

import { UserEntity } from "../../entities/UserEntity";

export async function getByOwnerId({ dynamoDBClient, ownerId }: { dynamoDBClient: DynamoDBDocumentClient, ownerId: string }): Promise<UserEntity | undefined> {
    const result = await dynamoDBClient.send(
        new QueryCommand({
            TableName: "Users",
            IndexName: "ownerId-index",
            KeyConditionExpression: "ownerId = :oid",
            ExpressionAttributeValues: {
                ":oid": ownerId,
            },
        })
    );

    if (!result.Items || result.Items.length === 0) {
        return undefined;
    }

    return result.Items[0] as UserEntity;
}

export async function getUnmatchedUsers({ dynamoDBClient }: { dynamoDBClient: DynamoDBDocumentClient }): Promise<UserEntity[]> {
    const result = await dynamoDBClient.send(new QueryCommand({
        TableName: "Users",
        IndexName: "isMatched-index",
        KeyConditionExpression: "isMatched = :val",
        ExpressionAttributeValues: { ":val": "false" }
    }));

    return result.Items ? (result.Items as UserEntity[]) : [];
}

export async function upsert({ dynamoDBClient, users }: { dynamoDBClient: DynamoDBDocumentClient, users: UserEntity[] }) {
    try {
        const putRequests = users.map(user => ({
            PutRequest: {
                Item: user
            }
        }));

        const command = new BatchWriteCommand({
            RequestItems: {
                Users: putRequests
            }
        });

        try {
            await dynamoDBClient.send(command);
            console.log("Users inserted!");
        } catch (error) {
            console.error("Error inserting user:", error);
        }
    }
    catch (error: any) {
        console.error("Upsert error:", error.message || error);
    }
}