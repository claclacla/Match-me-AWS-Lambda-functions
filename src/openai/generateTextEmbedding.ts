export async function generateTextEmbedding({ openai, text, dimension }:
    { openai: any, text: string, dimension: number }): Promise<number[]> {
    console.log(`Embedding generation for: "${text.substring(0, Math.min(text.length, 50))}..."`);

    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            // dimensions: 512, 
        });

        const embedding = response.data[0].embedding;

        if (!embedding || embedding.length !== dimension) {
            throw new Error(`Wrong embedding dimension. Needed: ${dimension}, Current: ${embedding ? embedding.length : 'N/A'}`);
        }

        return embedding;

    } catch (error: any) {
        console.error("Generation error:", error.message || error);

        if (error.response && error.response.data) {
            console.error("OpenAI error:", error.response.data);
        }

        throw new Error(`Error on embedding generation for the index: ${text.substring(0, 50)}...`);
    }
}