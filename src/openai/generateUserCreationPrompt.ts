import { UserDTO } from 'src/dtos/UserDTO';

export function generateUserCreationPrompt(user: UserDTO) {
    return `I am ${user.name} and my age is ${user.age}. My gender is ${user.gender}. I live in ${user.location}. ${user.bio}`;
}
