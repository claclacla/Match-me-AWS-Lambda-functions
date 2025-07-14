import * as dotenv from 'dotenv';

import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { UserDTO } from '../../dtos/UserDTO';
import { UserEntity } from '../../entities/UserEntity';

import { connect as openAIConnect } from '../../openai/connect';
import { generateGroupBehavior } from '../../openai/generateGroupBehavior';

import { connect as dynamoDBConnect } from '../../repositories/dynamoDB/connect';
import { upsert as dynamoDBUpsert } from '../../repositories/dynamoDB/users';

import { mapUserDTOToUserEntity } from '../../mappers/mapUserDTOToUserEntity';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!OPENAI_API_KEY || !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const userDTO: UserDTO = {
    id: "24a73e90-8c92-4a27-983a-3de2297bc654",
    name: "Sofia",
    surname: "Marino",
    gender: "female",
    yearOfBirth: 1996,
    location: "Milan",
    "languages": [
        "Italian",
        "English"
    ],
    groupProfile: {
        insights: [
            "You’ve just joined a 4-person team for a local quest. You barely know them. The leader asks everyone to share how they like to contribute. What do you say? I’m the glue — I keep the group vibe alive.",
            "Halfway to your destination, the group faces a delay. Tension rises. What’s your move? Crack a joke or lighten the mood.",
            "One member dominates the group talk, cutting others off. What do you do? Support quieter members by amplifying them.",
            "You arrive late to the group meetup. They’ve started without you. What do you feel? Slightly off, but I’ll catch up fast.",
            "Your group must choose between two activities. Opinions are split. What’s your role? I listen, then suggest a compromise.",
            "One person hasn’t spoken much. You’re in a circle about to share ideas. What do you do? Invite them in with an open question.",
            "The group must solve a timed puzzle. Everyone’s thinking differently. What’s your instinct? Back someone’s idea and help them push it through.",
            "After a long shared day, someone asks: 'How did you feel about our group?' You say… I liked how we all brought something unique.",
            "Two members quietly disagree. No one’s addressing it. What’s your reaction? Name it gently and check in with both.",
            "It’s time to part ways. Someone suggests staying in touch. What do you feel? Absolutely — I value these bonds."
        ],
        behavior: "",
    },
    profileSectionsStatus: {
        personalInformation: "completed",
        avatar: "pending",
        groupBehavior: "completed",
        voiceprint: "pending"
    }
};

const dynamoDBClient: DynamoDBDocumentClient = dynamoDBConnect({ region: AWS_REGION, accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY });
const openai = openAIConnect({ key: OPENAI_API_KEY });

async function insert({ userDTO }: { userDTO: UserDTO }) {
    const groupBehavior: string = await generateGroupBehavior({ openai, insights: userDTO.groupProfile.insights });
    userDTO.groupProfile.behavior = groupBehavior;

    const userEntity: UserEntity = mapUserDTOToUserEntity({ userDTO });

    console.log(`Inserting the new user...`);

    await dynamoDBUpsert({ dynamoDBClient, users: [userEntity] });

    console.log("New user added!");
}

insert({ userDTO: userDTO });