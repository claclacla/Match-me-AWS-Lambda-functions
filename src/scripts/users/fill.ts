import * as dotenv from 'dotenv';

import usersDataset from '../../../assets/users.json';

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

const usersDTO: UserDTO[] = usersDataset as UserDTO[];

const dynamoDBClient: DynamoDBDocumentClient = dynamoDBConnect({ region: AWS_REGION, accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY });
const openai = openAIConnect({ key: OPENAI_API_KEY });

async function fill() {
    try {
        console.log(`Inserting the data set users...`);

        const usersEntities: UserEntity[] = [];

        for (const userDTO of usersDTO) {
            const groupBehavior: string = await generateGroupBehavior({ openai, insights: userDTO.insights });
            userDTO.groupBehavior = groupBehavior;

            const userEntity: UserEntity = mapUserDTOToUserEntity({ userDTO });

            usersEntities.push(userEntity);
        }

        await dynamoDBUpsert({ dynamoDBClient, users: usersEntities });

        console.log("New users Added!");

    } catch (error: any) {
        console.error("Upsert error:", error.message || error);
    }
}

fill();