import { Pinecone } from '@pinecone-database/pinecone';

export function connect({ key }: { key: string }) {
    const pc = new Pinecone({
        apiKey: key
    });

    return pc;
}