export type UserGender = 'male' | 'female' | 'not_binary' | 'prefer_not_to_say';

export const GENDER_OPTIONS = [
    { label: 'Uomo', value: 'male' as UserGender },
    { label: 'Donna', value: 'female' as UserGender },
    { label: 'Non binario', value: 'non_binary' as UserGender },
    { label: 'Preferisco non specificare', value: 'prefer_not_to_say' as UserGender },
];

export const DEFAULT_GENDER: UserGender = 'prefer_not_to_say';

export interface UserDTO {
    id: string;
    name: string;
    gender: UserGender;
    location: string;
    age: number;
    insights: string[];
    narrative: string;
}