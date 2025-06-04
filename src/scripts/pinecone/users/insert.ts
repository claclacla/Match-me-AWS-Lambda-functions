import * as dotenv from 'dotenv';

import { DATA, PINECONE } from "../../../config/config.json";

import { UserDTO } from '../../../dtos/UserDTO';
import { UserEntity } from '../../../entities/UserEntity';

import { connect as openAIConnect } from '../../../openai/connect';
import { generateTextEmbedding } from '../../../openai/generateTextEmbedding';

import { connect as pineconeConnect } from '../../../repositories/pinecone/connect';
import { upsert } from '../../../repositories/pinecone/upsert';

dotenv.config();

const PINECONE_KEY = process.env.PINECONE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (PINECONE_KEY === undefined || OPENAI_API_KEY === undefined) {
    process.exit(1);
}

const userDTO: UserDTO = {
    "id": "user_010",
    "name": "Jack Lewis",
    "bio": "Passionate about electronic music and DJ sets. I enjoy going to concerts and discovering new artists, always looking for the right beat."
};

const pc = pineconeConnect({ key: PINECONE_KEY });
const usersIndex = pc.Index(PINECONE.INDEXES.USERS);

const openai = openAIConnect({ key: OPENAI_API_KEY });

async function insert({ user }: { user: UserDTO }) {
    const embedding = await generateTextEmbedding({ openai, text: user.bio, dimension: DATA.EMBEDDING_DIMENSION });

    const userEntity: UserEntity = {
        id: user.id,
        values: embedding,
        metadata: {
            name: user.name,
            bio: user.bio,
        },
    };

    console.log(`Vectors creation in the index "${PINECONE.INDEXES.USERS}"...`);

    await upsert({ index: usersIndex, vectors: [userEntity] });

    console.log("Vector created!");
}

insert({ user: userDTO });