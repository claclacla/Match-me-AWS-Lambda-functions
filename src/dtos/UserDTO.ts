import { ProfileSectionStatus } from "../types/ProfileSectionStatus";
import { UserGender } from "../types/UserGender";

export const GENDER_OPTIONS = [
    { label: 'Uomo', value: 'male' as UserGender },
    { label: 'Donna', value: 'female' as UserGender },
    { label: 'Non binario', value: 'non_binary' as UserGender },
    { label: 'Preferisco non specificare', value: 'prefer_not_to_say' as UserGender },
];

export const DEFAULT_GENDER: UserGender = 'prefer_not_to_say';

export interface UserDTO {
    id: string,                 // The Cognito user's id
    name: string,
    surname: string,
    gender: UserGender,
    country: string,
    location: string,
    yearOfBirth: number,
    languages: string[],
    groupProfile: {
        insights: string[],
        behavior: string
    },
    match?: {
        id: string,
    },
    profileSectionsStatus: {
        personalInformation: ProfileSectionStatus,
        avatar: ProfileSectionStatus,
        groupBehavior: ProfileSectionStatus,
        voiceprint: ProfileSectionStatus
    }
}