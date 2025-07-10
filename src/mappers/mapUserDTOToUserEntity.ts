import { v4 as uuidv4 } from 'uuid';

import { UserDTO } from "../dtos/UserDTO";
import { UserEntity } from '../entities/UserEntity';

export function mapUserDTOToUserEntity({ userDTO }: { userDTO: UserDTO }) {
    const userEntity: UserEntity = {
        id: uuidv4(),
        ownerId: userDTO.id,
        name: userDTO.name,
        gender: userDTO.gender,
        location: userDTO.location,
        yearOfBirth: userDTO.yearOfBirth,
        languages: userDTO.languages,
        insights: userDTO.insights,
        groupBehavior: userDTO.groupBehavior,
        isMatched: "false"
    };

    if (userDTO.match?.id) {
        userEntity.isMatched = "true";
        userEntity.match = {
            id: userDTO.match.id
        };
    }

    return userEntity;
}