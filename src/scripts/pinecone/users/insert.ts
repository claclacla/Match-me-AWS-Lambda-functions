import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import { DATA, PINECONE } from "../../../config/config.json";

import { UserDTO } from '../../../dtos/UserDTO';
import { UserEntity } from '../../../entities/UserEntity';

import { connect as openAIConnect } from '../../../openai/connect';
import { generateTextEmbedding } from '../../../openai/generateTextEmbedding';
import { generateUserCreationPrompt } from '../../../openai/generateUserCreationPrompt';

import { connect as pineconeConnect } from '../../../repositories/pinecone/connect';
import { upsert } from '../../../repositories/pinecone/upsert';

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
  "narrative": "I arrived at the bustling square and immediately sought a higher vantage point, climbing a tower to take in the full scene. I like to see things from above before diving in. When offered a companion, I chose the hyper-curious guide who never stopped asking questions—someone who keeps me thinking and exploring. When invited to a mysterious underground event, I politely declined at first, wanting to understand more before jumping in. Later, when asked to join a spontaneous performance, I took part as an observer and supporter, feeling comfortable expressing myself in my own way. In a room full of strangers, I’m the one who asks the questions that spark deeper conversation. If I had to draw a memory that defines me, it would be a symbol—abstract, open to interpretation, much like how I see the world. Given the choice, I join the Builders: the thinkers, planners, and debaters who shape ideas into reality. And above all, when I connect with someone, what I want most is to feel inspired—energized by new perspectives and shared curiosity."
};

const pc = pineconeConnect({ key: PINECONE_KEY });
const usersIndex = pc.Index(PINECONE.INDEXES.USERS);

const openai = openAIConnect({ key: OPENAI_API_KEY });

async function insert({ user }: { user: UserDTO }) {
    const embedding = await generateTextEmbedding({ 
        openai, 
        text: generateUserCreationPrompt(user), 
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

    await upsert({ index: usersIndex, vectors: [userEntity] });

    console.log("Vector created!");
}

insert({ user: userDTO });