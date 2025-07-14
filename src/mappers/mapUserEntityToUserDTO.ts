import { UserDTO } from "../dtos/UserDTO";
import { UserEntity } from "../entities/UserEntity";

export function mapUserEntityToUserDTO({ userEntity }: { userEntity: UserEntity }) {
    const userDTO: UserDTO = {
        id: userEntity.ownerId,
        name: userEntity.name,
        surname: userEntity.surname,
        gender: userEntity.gender,
        country: userEntity.country,
        location: userEntity.location,
        yearOfBirth: userEntity.yearOfBirth,
        languages: userEntity.languages,
        groupProfile: userEntity.groupProfile,
        profileSectionsStatus: {
            personalInformation: userEntity.profileSectionsStatus.personalInformation,
            avatar: userEntity.profileSectionsStatus.avatar,
            groupBehavior: userEntity.profileSectionsStatus.groupBehavior,
            voiceprint: userEntity.profileSectionsStatus.voiceprint
        }
    }

    if (userEntity.match?.id) {
        userDTO.match = {
            id: userEntity.match.id
        };
    }

    return userDTO;
}