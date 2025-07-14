import { v4 as uuidv4 } from 'uuid';

import { UserDTO } from "../dtos/UserDTO";
import { UserEntity } from '../entities/UserEntity';

export function mapUserDTOToUserEntity({ userDTO }: { userDTO: UserDTO }) {
    const userEntity: UserEntity = {
        id: uuidv4(),
        ownerId: userDTO.id,
        name: userDTO.name,
        surname: userDTO.surname,
        gender: userDTO.gender,
        country: userDTO.country,
        location: userDTO.location,
        yearOfBirth: userDTO.yearOfBirth,
        languages: userDTO.languages,
        groupProfile: userDTO.groupProfile,
        isMatched: "false",
        profileSectionsStatus: {
            personalInformation: userDTO.profileSectionsStatus.personalInformation,
            avatar: userDTO.profileSectionsStatus.avatar,
            groupBehavior: userDTO.profileSectionsStatus.groupBehavior,
            voiceprint: userDTO.profileSectionsStatus.voiceprint
        }
    };

    if (userDTO.match?.id) {
        userEntity.isMatched = "true";
        userEntity.match = {
            id: userDTO.match.id
        };
    }

    return userEntity;
}