# 🧠 MatchMe · Core Logic Scripts

This repository contains the core scripts that power the **user logic** of the **MatchMe** application, a social platform designed to form meaningful, small-group connections between people.

## ✨ Features

- 🔄 Insert and retrieve user data
- 🧠 Generate enriched personality and group behavior descriptions using the OpenAI API
- 📦 Store user information and insights in **DynamoDB**

## 🚧 In Development

An agent-based matching engine that will:

- 🤖 Act as a smart agent to form and suggest ideal small groups
- 🧩 Use OpenAI to understand group dynamics, social energy, and diversity
- 📊 Create balanced, engaging, and context-aware groupings from unmatched users

## 🛠️ Architecture Overview

- **DynamoDB** — stores user data and AI-generated insights   
- **OpenAI API** — used to extract meaning and personality from onboarding responses  
- **TypeScript** — all logic written in clean, modular TS, designed for backend integration

## 📦 Usage

These scripts are intended to be integrated into the main backend API of the MatchMe app and can be run manually or triggered as part of automated onboarding and matching workflows.

--------------------------------------------------------------------------------

## AWS 

The infrastructure is based on: `Cognito` for user authentication, `AWS API Gateway` for defining the API, `Lambda` for implementing the API functions and `DynamoDB` for storing the users data.

--------------------------------------------------------------------------------

## Scripts

The folder `assets` must contain a valid dataset in the `users.json` file. The description of the user is the `UserDTO.ts`.

The .env file MUST contain the following properties:

- OPENAI_API_KEY
- PINECONE_KEY
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION

The scripts are built using the following command:

```bash

npm run build

```

### List of scripts

- Fill the index `users` with the assets data seeds

```bash

npm run fill-users

```

- Insert a new user

```bash

npm run insert-user

```


- Match users

```bash

npm run match-users

```

--------------------------------------------------------------------------------

## Deploy

Every Lambda function needs a ZIP file to be uploaded. To create it, follow these steps:

- Build the distribution

```bash

npm run build

```

- Install production dependencies and copy node_modules into the build folder

```bash

npm i --production
rm -fr build/node_modules && cp -fr node_modules build

```

- Move into the `build` folder
- Create a zip archive

```bash

zip -r ../lambda_package.zip ./*

```

The package is now ready to be uploaded to AWS Lambda!

--------------------------------------------------------------------------------

## Authors

- **Simone Adelchino** - 
