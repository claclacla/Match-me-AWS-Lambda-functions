import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";

import { UserEntity } from "../../entities/UserEntity";

import { PINECONE } from "../../config/config.json";

function getUserIndex({ pineconeClient }: { pineconeClient: Pinecone }) {
    return pineconeClient.Index(PINECONE.INDEXES.USERS);
}

export async function upsert({ pineconeClient, users }: { pineconeClient: Pinecone, users: UserEntity[] }) {
    const usersIndex = getUserIndex({ pineconeClient });

    try {
        await usersIndex.upsert(users);
    }
    catch (error: any) {
        console.error("Upsert error:", error.message || error);
    }
}