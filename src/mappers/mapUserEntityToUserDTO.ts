import { UserDTO } from "../dtos/UserDTO";
import { UserEntity } from "../entities/UserEntity";

export function mapUserEntityToUserDTO({ userEntity }: { userEntity: UserEntity }) {
    const userDTO: UserDTO = {
        id: userEntity.ownerId,
        name: userEntity.name,
        gender: userEntity.gender,
        location: userEntity.location,
        yearOfBirth: userEntity.yearOfBirth,
        languages: userEntity.languages,
        insights: userEntity.insights,
        groupBehavior: userEntity.groupBehavior
    }

    if (userEntity.match?.id) {
        userDTO.match = {
            id: userEntity.match.id
        };
    }

    return userDTO;
}