import { UserGender } from "../types/UserGender";
import { BooleanString } from "../types/BooleanString";
import { ProfileSectionStatus } from "../types/ProfileSectionStatus";

export interface UserEntity {
    id: string,
    ownerId: string,            // The Cognito user's id or the UserDTO.id
    name: string,
    surname: string,
    gender: UserGender,
    location: string,
    yearOfBirth: number,
    languages: string[],
    groupProfile: {
        insights: string[],
        behavior: string
    },
    isMatched: BooleanString,   // Here, isMatched is a string because it's used as index in DynamoDB
    match?: {
        id: string;
    },
    profileSectionsStatus: {
        personalInformation: ProfileSectionStatus,
        avatar: ProfileSectionStatus,
        groupBehavior: ProfileSectionStatus,
        voiceprint: ProfileSectionStatus
    }
}