# A Pinecone for friend

AI-Powered Human Matchmaking App based on Pinecone and React Native

This repository contains the code for a mobile application designed to help individuals find compatible connections in new environments. Developed with React Native and Expo, this app utilizes cutting-edge AI vector embeddings to enable intelligent matchmaking based on semantic similarity, moving beyond basic filtering.

At its core, the app leverages Pinecone, a powerful vector database, for efficient storage and retrieval of user profiles, matching individuals based on the deep meaning captured in their personal descriptions. A lightweight Node.js micro-server serves as the secure backend, managing user data and orchestrating the AI-driven matching process with Pinecone.

This project aims to facilitate new social interactions by intelligently connecting people with shared interests and complementary profiles.

--------------------------------------------------------------------------------

## Status and TO DO

I wrote four scripts: one to create the user index on Pinecone, one to seed it with initial data, one to insert a user, and one to search for users similar to a given user ID.

The `findSimilarUsersById` script has now been used to create a Lambda function with the same name. This function retrieves similar users from Pinecone via AWS Lambda.

Currently, all users can access each other's data and search for similar users. The next step is to introduce an `authenticatedUserId` parameter in Pinecone to associate AWS Cognito users with their respective data.

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

- **Simone Adelchino** - [_claclacla_](https://twitter.com/_claclacla_)