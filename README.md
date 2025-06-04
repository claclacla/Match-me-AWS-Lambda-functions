# Match me! (AWS Lambda functions)

This repository holds the AWS Lambda functions that power the secure, serverless backend for the `Match Me!` application.

Utilizing `Pinecone` for efficient vector storage and AI embeddings for `semantic similarity`, these functions orchestrate the core matchmaking logic, enabling intelligent connections based on user profiles and interests. Designed as a standalone API layer, this backend is ready to integrate with separate mobile or web frontends.

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
