import { ReadStream } from "fs";

export async function generateTranscription({ openai, audioFileStream }: { openai: any, audioFileStream: ReadStream }): Promise<string> {
    const transcription = await openai.audio.transcriptions.create({
        file: audioFileStream,
        model: 'whisper-1',
    });

    return transcription.text;
}