export async function upsert({ index, vectors }: { index: any, vectors: any[] }) {
    try {
        await index.upsert(vectors);
    }
    catch (error: any) {
        console.error("Upsert error:", error.message || error);
    }
}