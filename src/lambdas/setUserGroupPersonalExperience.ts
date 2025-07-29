import { promises as fs, createReadStream } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import Busboy from 'busboy';
import { Readable } from 'stream';
import { Buffer } from 'buffer';

import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { connect as openAIConnect } from '../openai/connect';
import { generateTranscription } from '../openai/generateTranscription';

import { connect as dynamoDBConnect } from '../repositories/dynamoDB/connect';
import { setUserGroupPersonalExperience } from '../repositories/dynamoDB/users';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const dynamoDBClient: DynamoDBDocumentClient = dynamoDBConnect();
const openai = openAIConnect({ key: OPENAI_API_KEY });

function parseMultipart({ buffer, headers }: { buffer: Buffer, headers: Record<string, string> }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        console.log('Parsing multipart data...');

        const busboy = Busboy({
            headers: {
                'content-type': headers['Content-Type'] || headers['content-type'],
                'content-length': headers['Content-Length'] || headers['content-length']
            }
        });

        const fileChunks: Buffer[] = [];

        busboy.on('file', (fieldname, fileStream, info) => {
            fileStream.on('data', (chunk: Buffer) => {
                fileChunks.push(chunk);
            });

            fileStream.on('end', () => {
                console.log('File upload complete.');
            });

            fileStream.on('error', (err) => {
                console.error('Error reading file stream:', err);
                reject(err);
            });
        });

        busboy.on('field', (fieldname, val) => {
            console.log(`Field received: [${fieldname}]: ${val}`);
        });


        busboy.on('error', (err) => {
            console.error('Busboy error:', err);
            reject(err);
        });

        busboy.on('finish', () => {
            console.log('Busboy finished parsing.');
            if (fileChunks.length === 0) {
                console.warn('No file chunks found after busboy finish.'); // Improved log
                reject(new Error('No file uploaded'));
                return;
            }
            const fileBuffer = Buffer.concat(fileChunks);
            console.log(`Total file size received: ${fileBuffer.length} bytes`);
            resolve(fileBuffer);
        });

        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(busboy);
    });
};

async function writeAudioFile({ audioBuffer, folder, filename }: { audioBuffer: Buffer, folder: string, filename: string }) {
    const filePath = path.join(folder, filename);

    await fs.writeFile(filePath, audioBuffer);
    console.log(`Saved audio to temp file: ${filePath}`);

    return filePath;
}

export const handler = async (event: any) => {
    const ownerId = event.pathParameters?.id;

    if (!ownerId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing user ID in path." }),
        };
    }

    if (!event.body) {
        console.warn('Request body is empty');
        return { statusCode: 400, body: 'Request body is empty' };
    }

    const contentType = event.headers['Content-Type'] || event.headers['content-type'];
    const contentLength = event.headers['Content-Length'] || event.headers['content-length'];

    console.log('Content-Type:', contentType);
    console.log('Content-Length:', contentLength);

    if (!contentType || !contentType.startsWith('multipart/form-data')) {
        console.warn('Invalid Content-Type');
        return { statusCode: 400, body: 'Content-Type must be multipart/form-data' };
    }

    const bodyBuffer = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : Buffer.from(event.body);

    console.log('Body buffer size (after decoding if applicable):', bodyBuffer.length);

    try {
        const audioBuffer = await parseMultipart({ buffer: bodyBuffer, headers: event.headers });
        const audioFilePath: string = await writeAudioFile({ audioBuffer, folder: "/tmp", filename: `audio-${uuidv4()}.m4a` });
        const audioFileStream = createReadStream(audioFilePath);

        const transcription: string = await generateTranscription({ openai, audioFileStream });

        console.log('Transcription received:', transcription);

        await setUserGroupPersonalExperience({ dynamoDBClient, ownerId, personalExperience: transcription });

        // Clean up file

        await fs.unlink(audioFilePath);
        console.log(`Deleted temp file: ${audioFilePath}`);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupPersonalExperience: transcription }),
        };
    } catch (error: any) {
        console.error('Error processing transcription:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
        };
    }
};