import * as dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';

import { DATA, PINECONE } from "../../../config/config.json";

import { UserDTO } from '../../../dtos/UserDTO';
import { UserEntity } from '../../../entities/UserEntity';

import { connect as openAIConnect } from '../../../openai/connect';
import { generateTextEmbedding } from '../../../openai/generateTextEmbedding';
import { generateNarrative } from '../../../openai/generateNarrative';

import { connect as pineconeConnect } from '../../../repositories/pinecone/connect';
import { upsert as pineconeUsersUpsert } from "../../../repositories/pinecone/users";

dotenv.config();

const PINECONE_KEY = process.env.PINECONE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (PINECONE_KEY === undefined || OPENAI_API_KEY === undefined) {
    process.exit(1);
}

const userDTO: UserDTO = {
    "id": "9f8e4074-497d-4ea4-b48a-013abc4b8b6e",
    "name": "Liam Scott",
    "gender": "male",
    "age": 23,
    "location": "Milan",
    "insights": [
        "You arrive at a large square where a crowd gathers. Music echoes from the side streets. What do you do? Climb a tower to get a better view.",
        "A host offers you a companion to explore with. Who do you pick? A hyper-curious guide asking endless questions.",
        "Someone invites you to an underground event. It’s unstructured, strange, and secret. How do you respond? Politely decline and ask what it’s about first.",
        "You're asked to join a spontaneous performance. It involves movement, expression, maybe even embarrassment. What do you do? Join, but only as an observer/supporter.",
        "You’re placed in a room with strangers for 5 minutes. What do you do? Ask a thought-provoking question.",
        "You’re asked to draw a memory that defines you. What do you draw? Draw a symbol or abstract shape.",
        "You can join one of three groups in the city. Which do you choose? The Builders – thinkers, planners, debaters.",
        "When you connect with someone, what do you most want to feel? Inspired."
    ],
    "narrative": ""
};

const pineconeClient: Pinecone = pineconeConnect({ key: PINECONE_KEY });
const openai = openAIConnect({ key: OPENAI_API_KEY });

async function insert({ user }: { user: UserDTO }) {
    const narrative: string = await generateNarrative({ openai, insights: user.insights });

    const embedding = await generateTextEmbedding({
        openai,
        text: narrative,
        dimension: DATA.EMBEDDING_DIMENSION
    });

    const userEntity: UserEntity = {
        id: user.id,
        values: embedding,
        metadata: {
            ownerId: "",
            name: user.name,
            gender: user.gender,
            location: user.location,
            age: user.age,
            insights: user.insights,
            narrative: user.narrative
        },
    };

    console.log(`Vectors creation in the index "${PINECONE.INDEXES.USERS}"...`);

    await pineconeUsersUpsert({ pineconeClient, users: [userEntity] });

    console.log("Vector created!");
}

insert({ user: userDTO });