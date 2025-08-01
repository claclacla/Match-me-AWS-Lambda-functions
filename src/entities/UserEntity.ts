import { UserGender } from "../types/UserGender";
import { BooleanString } from "../types/BooleanString";
import { ProfileSectionStatus } from "../types/ProfileSectionStatus";
import { ProfileSectionKey } from "../types/ProfileSectionKey";
import { LocationData } from "../types/LocationData";

export interface UserEntity {
    id: string,
    ownerId: string,            // The Cognito user's id or the UserDTO.id
    name: string,
    surname: string,
    gender: UserGender,
    country?: string,
    location?: LocationData,
    yearOfBirth: number,
    languages: string[],
    avatar?: string,
    groupProfile: {
        insights?: string[],
        personalExperience?: {
            description: string
        },
        behavior?: string
    },
    isMatched: BooleanString,   // Here, isMatched is a string because it's used as index in DynamoDB
    match?: {
        id: string;
    },
    profileSectionsStatus: Record<ProfileSectionKey, ProfileSectionStatus>
}