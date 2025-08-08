import { UserGender } from "../types/UserGender";
import { BooleanString } from "../types/BooleanString";
import { ProfileSectionStatus } from "../types/ProfileSectionStatus";
import { ProfileSectionKey } from "../types/ProfileSectionKey";
import { LocationData } from "../types/LocationData";
import { GroupBehaviorFactors } from "../types/GroupBehaviorFactors";

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
        behavior?: {
            description: string,
            factors: GroupBehaviorFactors,
        }
    },
    needsGroupBehaviorUpdate: BooleanString,
    isMatched: BooleanString,   
    match?: {
        id: string;
    },
    profileSectionsStatus: Record<ProfileSectionKey, ProfileSectionStatus>
}