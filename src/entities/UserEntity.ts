export interface UserEntity {
    id: string,
    values: number[],
    metadata: {
        ownerId: string,
        name: string,
        gender: string,
        location: string,
        age: number,
        bio: string
    }
}