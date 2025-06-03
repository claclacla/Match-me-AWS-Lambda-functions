export async function query({ index, params }: { index: any, params: any }) {
    try {
        return await index.query(params);
    }
    catch (error: any) {
        console.error("Fetch error:", error.message || error);
    }
}