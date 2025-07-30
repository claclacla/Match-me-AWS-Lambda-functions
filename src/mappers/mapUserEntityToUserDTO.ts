import { UserDTO } from "../dtos/UserDTO";
import { UserEntity } from "../entities/UserEntity";

export function mapUserEntityToUserDTO({ userEntity }: { userEntity: UserEntity }) {
    const userDTO: UserDTO = {
        id: userEntity.ownerId,
        name: userEntity.name,
        surname: userEntity.surname,
        gender: userEntity.gender,
        location: userEntity.location,
        yearOfBirth: userEntity.yearOfBirth,
        languages: userEntity.languages,
        groupProfile: userEntity.groupProfile,
        profileSectionsStatus: {
            personalInformation: userEntity.profileSectionsStatus.personalInformation,
            avatar: userEntity.profileSectionsStatus.avatar,
            groupPersonalExperience: userEntity.profileSectionsStatus.groupPersonalExperience,
            groupInsights: userEntity.profileSectionsStatus.groupInsights
        }
    }

    if (userDTO.avatar !== undefined) {
        userEntity.avatar = userDTO.avatar;
    }

    if (userDTO.country !== undefined) {
        userEntity.country = userDTO.country;
    }

    if (userEntity.match?.id !== undefined) {
        userDTO.match = {
            id: userEntity.match.id
        };
    }

    return userDTO;
}