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
        yearOfBirth: userDTO.yearOfBirth,
        languages: userDTO.languages,
        groupProfile: userDTO.groupProfile,
        isReadyForMatch: "false",
        isMatched: "false",
        profileSectionsStatus: {
            personalInformation: userDTO.profileSectionsStatus.personalInformation,
            avatar: userDTO.profileSectionsStatus.avatar,
            groupPersonalExperience: userDTO.profileSectionsStatus.groupPersonalExperience,
            groupInsights: userDTO.profileSectionsStatus.groupInsights
        }
    };

    if(userDTO.avatar !== undefined) {
        userEntity.avatar = userDTO.avatar;
    }

    if (userDTO.location !== undefined) {
        userEntity.location = userDTO.location;
    }

    if(userDTO.country !== undefined) {
        userEntity.country = userDTO.country;
    }

    if(userDTO.groupProfile.insights !== undefined && userDTO.groupProfile.insights.length > 0) {
        userEntity.isReadyForMatch = "true";
    }

    if(userDTO.groupProfile.personalExperience !== undefined && userDTO.groupProfile.personalExperience.description !== undefined) {
        userEntity.isReadyForMatch = "true";
    }

    if (userDTO.match?.id !== undefined) {
        userEntity.isMatched = "true";
        userEntity.match = {
            id: userDTO.match.id
        };
    }

    return userEntity;
}