import { UserGender } from "../dtos/UserDTO";

export interface UserEntity {
    id: string,
    ownerId: string,    // The Cognito user's id or the UserDTO.id
    name: string,
    gender: UserGender,
    location: string,
    yearOfBirth: number,
    insights: string[],
    groupBehavior: string,
    match?: {
        id: string;
    }
}