import { DynamoDBDocumentClient, BatchWriteCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { UserEntity } from "../../entities/UserEntity";
import { PROFILE_SECTION_STATUS, ProfileSectionStatus } from "../../types/ProfileSectionStatus";
import { ProfileSectionKey } from "../../types/ProfileSectionKey";

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

export async function setUserGroupInsights({ dynamoDBClient, ownerId, insights }:
    { dynamoDBClient: DynamoDBDocumentClient, ownerId: string, insights: string[] }): Promise<void> {
    const item = await getByOwnerId({ dynamoDBClient, ownerId });

    if (!item) {
        throw new Error("User not found");
    }

    await dynamoDBClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: item.id },
        UpdateExpression: 'SET #gp.#in = :gpin, #pss.#pssi = :pssi, #ngbu = :ngbu',
        ExpressionAttributeValues: {
            ':gpin': insights,
            ':pssi': PROFILE_SECTION_STATUS.COMPLETED,
            ':ngbu': "true"
        },
        ExpressionAttributeNames: {
            '#gp': 'groupProfile',
            '#in': 'insights',
            '#pss': 'profileSectionsStatus',
            '#pssi': 'groupInsights',
            '#ngbu': 'needsGroupBehaviorUpdate'
        }
    }));
}

export async function setUserGroupPersonalExperience({ dynamoDBClient, ownerId, personalExperience }:
    { dynamoDBClient: DynamoDBDocumentClient, ownerId: string, personalExperience: string }): Promise<void> {
    const item = await getByOwnerId({ dynamoDBClient, ownerId });

    if (!item) {
        throw new Error("User not found");
    }

    await dynamoDBClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: item.id },
        UpdateExpression: 'SET #gp.#pe = :pe, #pss.#pssgpe = :pssgpe, #ngbu = :ngbu',
        ExpressionAttributeValues: {
            ':pe': { description: personalExperience },
            ':pssgpe': PROFILE_SECTION_STATUS.COMPLETED,
            ':ngbu': "true"
        },
        ExpressionAttributeNames: {
            '#gp': 'groupProfile',
            '#pe': 'personalExperience',
            '#pss': 'profileSectionsStatus',
            '#pssgpe': 'groupPersonalExperience',
            '#ngbu': 'needsGroupBehaviorUpdate'
        }
    }));
}

export async function setUserProfileSectionStatus({ dynamoDBClient, ownerId, section, value }: {
    dynamoDBClient: DynamoDBDocumentClient, ownerId: string, section: ProfileSectionKey, value: ProfileSectionStatus }): Promise<void> {
    const item = await getByOwnerId({ dynamoDBClient, ownerId });

    if (!item) {
        throw new Error("User not found");
    }

    await dynamoDBClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: item.id },
        UpdateExpression: 'SET #pss.#section = :value',
        ExpressionAttributeValues: {
            ':value': value,
        },
        ExpressionAttributeNames: {
            '#pss': 'profileSectionsStatus',
            '#section': section,
        },
    }));
}

export async function setUserAvatar({ dynamoDBClient, ownerId, avatar }: {
    dynamoDBClient: DynamoDBDocumentClient, ownerId: string, avatar: string }): Promise<void> {
    const item = await getByOwnerId({ dynamoDBClient, ownerId });

    if (!item) {
        throw new Error("User not found");
    }

    await dynamoDBClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: item.id },
        UpdateExpression: 'SET #av = :value',
        ExpressionAttributeValues: {
            ':value': avatar,
        },
        ExpressionAttributeNames: {
            '#av': 'avatar'
        },
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