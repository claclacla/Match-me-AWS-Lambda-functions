import { UserGender } from "../dtos/UserDTO";

export interface UserEntity {
    id: string,
    ownerId: string,
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