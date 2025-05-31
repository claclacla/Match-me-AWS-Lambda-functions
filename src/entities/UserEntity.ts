export interface UserEntity {
    id: string,
    values: number[],
    metadata: {
        name: string,
        bio: string
    }
}