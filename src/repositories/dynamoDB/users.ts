import { DynamoDBDocumentClient, BatchWriteCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { UserEntity } from "../../entities/UserEntity";
import { PROFILE_SECTION_STATUS, ProfileSectionStatus } from "../../types/ProfileSectionStatus";

const TABLE_NAME: string = "Users";

export async function getByOwnerId({ dynamoDBClient, ownerId }: { dynamoDBClient: DynamoDBDocumentClient, ownerId: string }): Promise<UserEntity | undefined> {
    const result = await dynamoDBClient.send(
        new QueryCommand({
            TableName: TABLE_NAME,
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
        TableName: TABLE_NAME,
        IndexName: "isMatched-index",
        KeyConditionExpression: "isMatched = :val",
        ExpressionAttributeValues: { ":val": "false" }
    }));

    return result.Items ? (result.Items as UserEntity[]) : [];
}

export async function setUserGroupBehavior({ dynamoDBClient, ownerId, insights, groupBehavior }:
    { dynamoDBClient: DynamoDBDocumentClient, ownerId: string, insights: string[], groupBehavior: string }): Promise<void> {
    const result = await dynamoDBClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'ownerId-index',
        KeyConditionExpression: 'ownerId = :oid',
        ExpressionAttributeValues: {
            ':oid': ownerId
        }
    }));

    const item = result.Items?.[0];

    if (!item) {
        throw new Error("User not found");
    }

    await dynamoDBClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: item.id },
        UpdateExpression: 'SET #gp.#in = :gpin, #gp.#be = :gpbe, #pss.#pssgb = :pssgb',
        ExpressionAttributeValues: {
            ':gpin': insights,
            ':gpbe': groupBehavior,
            ':pssgb': PROFILE_SECTION_STATUS.COMPLETED
        },
        ExpressionAttributeNames: {
            '#gp': 'groupProfile',
            '#in': 'insights',
            '#be': 'behavior',
            '#pss': 'profileSectionsStatus',
            '#pssgb': 'groupBehavior'
        }
    }));
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
                [TABLE_NAME]: putRequests
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