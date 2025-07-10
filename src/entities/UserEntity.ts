import { UserGender } from "../types/UserGender";
import { BooleanString } from "../types/BooleanString";

export interface UserEntity {
    id: string,
    ownerId: string,            // The Cognito user's id or the UserDTO.id
    name: string,
    gender: UserGender,
    location: string,
    yearOfBirth: number,
    languages: string[],
    insights: string[],
    groupBehavior: string,
    isMatched: BooleanString,   // Here, isMatched is a string because it's used as index in DynamoDB
    match?: {
        id: string;
    }
}