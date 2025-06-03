export async function getByIds({ index, ids }: { index: any, ids: string[] }) {
    try {
        return await index.fetch(ids);
    }
    catch (error: any) {
        console.error("Fetch error:", error.message || error);
    }
}