/*
import { RecordMetadata, ScoredPineconeRecord } from "@pinecone-database/pinecone";
import { UserEntity } from "../entities/UserEntity";

function isUserMetadata(obj: any): obj is UserEntity["metadata"] {
    return obj
        && typeof obj.ownerId === "string"
        && typeof obj.name === "string"
        && typeof obj.gender === "string"
        && typeof obj.location === "string"
        && typeof obj.age === "number"
        && Array.isArray(obj.insights)
        && typeof obj.narrative === "string"
        && typeof obj.idealMatchProfile === "string"
        //&& Array.isArray(obj.idealMatchProfileEmbedding)
        && typeof obj.matchId === "string";
}

export function mapPineconeUserRecordToUserEntity({ pineconeUserRecord }: { pineconeUserRecord: ScoredPineconeRecord<RecordMetadata> }): UserEntity {
    if (!pineconeUserRecord.metadata) {
        throw new Error("Missing metadata in Pinecone record");
    }

    if (!isUserMetadata(pineconeUserRecord.metadata)) {
        throw new Error("Metadata shape does not match UserEntity.metadata");
    }

    const userEntity: UserEntity = {
        id: pineconeUserRecord.id,
        values: pineconeUserRecord.values || [],
        metadata: {
            ownerId: pineconeUserRecord.metadata.ownerId,
            name: pineconeUserRecord.metadata.name,
            gender: pineconeUserRecord.metadata.gender,
            location: pineconeUserRecord.metadata.location,
            age: pineconeUserRecord.metadata.age,
            insights: pineconeUserRecord.metadata.insights,
            narrative: pineconeUserRecord.metadata.narrative,
            idealMatchProfile: pineconeUserRecord.metadata.idealMatchProfile,
            //idealMatchProfileEmbedding: pineconeUserRecord.metadata.idealMatchProfileEmbedding,
            matchId: pineconeUserRecord.metadata.matchId
        }
    };

    return userEntity;
}
*/