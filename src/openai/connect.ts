import OpenAI from "openai";

export function connect({ key }: { key: string }) {
    const openai = new OpenAI({
        apiKey: key,
    });

    return openai;
}