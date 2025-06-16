export interface UserEntity {
    id: string,
    values: number[],
    metadata: {
        name: string,
        gender: string,
        location: string,
        age: number,
        bio: string
    }
}