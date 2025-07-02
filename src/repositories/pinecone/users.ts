import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";

import { UserEntity } from "../../entities/UserEntity";

import { PINECONE } from "../../config/config.json";

function getUsersIndex({ pineconeClient }: { pineconeClient: Pinecone }) {
    return pineconeClient.Index(PINECONE.INDEXES.USERS);
}

const EMPTY_VECTOR: number[] = Array(1536).fill(0);

interface QueryProps { 
    pineconeClient: Pinecone, 
    limit?: number, 
    filter?: {}, 
    vector?: number[] 
}

export async function query({ pineconeClient, limit = 1, filter = {}, vector = EMPTY_VECTOR }: QueryProps) {
    const usersIndex = getUsersIndex({ pineconeClient });

    try {
        return await usersIndex.query({
            topK: limit,
            includeMetadata: true,
            vector,
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