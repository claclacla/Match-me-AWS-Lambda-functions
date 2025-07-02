import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";

import { UserEntity } from "../../entities/UserEntity";

import { PINECONE } from "../../config/config.json";

function getUsersIndex({ pineconeClient }: { pineconeClient: Pinecone }) {
    return pineconeClient.Index(PINECONE.INDEXES.USERS);
}

export async function query({ pineconeClient, limit = 1, filter }: { pineconeClient: Pinecone, limit?: number, filter: {} }) {
    const usersIndex = getUsersIndex({ pineconeClient });

    try {
        return await usersIndex.query({
            topK: limit,
            includeMetadata: true,
            vector: Array(1536).fill(0), 
            filter
        });
    }
    catch (error: any) {
        console.error("Query error:", error.message || error);
    }
}

export async function upsert({ pineconeClient, users }: { pineconeClient: Pinecone, users: UserEntity[] }) {
    const usersIndex = getUsersIndex({ pineconeClient });

    try {
        await usersIndex.upsert(users);
    }
    catch (error: any) {
        console.error("Upsert error:", error.message || error);
    }
}