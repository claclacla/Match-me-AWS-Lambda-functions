# Lambda Functions Architecture Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Lambda Functions](#lambda-functions)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Authentication & Authorization](#authentication--authorization)
7. [Error Handling](#error-handling)

---

## Overview

This document describes the architecture of the AWS Lambda functions that power the **MatchMe** application's user management and profile system. The application is a social platform designed to form meaningful, small-group connections between people.

### Infrastructure Stack

- **AWS API Gateway** - RESTful API endpoint definitions
- **AWS Lambda** - Serverless function execution
- **AWS Cognito** - User authentication and authorization
- **AWS DynamoDB** - Primary data storage for user profiles
- **AWS S3** - File storage for user avatars
- **OpenAI API** - AI-powered transcription and insights generation

---

## Architecture Pattern

### Layered Architecture

The Lambda functions follow a **layered architecture pattern** with clear separation of concerns:

```
┌─────────────────────────────────────┐
│      API Gateway (REST Endpoints)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Lambda Functions (Handlers)    │
│  - Request validation               │
│  - Business logic orchestration     │
│  - Response formatting              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Mappers (DTO ↔ Entity)         │
│  - Data transformation              │
│  - Type conversion                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Repositories (Data Access)      │
│  - DynamoDB operations              │
│  - S3 operations                    │
│  - Pinecone operations              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      External Services               │
│  - OpenAI API                       │
│  - AWS Services                     │
└─────────────────────────────────────┘
```

### Key Design Principles

1. **Single Responsibility** - Each Lambda handles one specific user operation
2. **Repository Pattern** - Data access abstracted through repository interfaces
3. **DTO/Entity Separation** - Clean separation between API contracts and database models
4. **Type Safety** - Full TypeScript implementation with strict typing
5. **Error Handling** - Consistent error responses across all functions

---

## Lambda Functions

### 1. `getUser`

**Purpose**: Retrieves the authenticated user's complete profile information.

**Endpoint**: `GET /user`

**Authentication**: Required (Cognito JWT)

**Flow**:
1. Extracts authenticated user ID from JWT claims
2. Queries DynamoDB using `ownerId-index` GSI
3. Maps `UserEntity` to `UserDTO`
4. Returns user profile

**Key Features**:
- Uses Cognito JWT claims for user identification
- Returns 404 if user not found
- Returns 401 if authentication fails

**Response**:
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "surname": "string",
    "gender": "UserGender",
    "groupProfile": { ... },
    "profileSectionsStatus": { ... }
  }
}
```

---

### 2. `insertUser`

**Purpose**: Creates a new user profile in the system (onboarding).

**Endpoint**: `POST /user`

**Authentication**: Required (Cognito JWT)

**Flow**:
1. Extracts authenticated user ID from JWT
2. Parses user data from request body
3. Sets user ID to authenticated Cognito user ID
4. Initializes `profileSectionsStatus` with default values:
   - `personalInformation`: "completed"
   - `avatar`: "pending"
   - `groupPersonalExperience`: "pending"
   - `groupInsights`: "pending"
5. Maps `UserDTO` to `UserEntity`
6. Upserts user into DynamoDB

**Key Features**:
- Enforces user ID from authentication token
- Sets initial profile completion status
- Validates JSON body structure

**Request Body**:
```json
{
  "name": "string",
  "surname": "string",
  "gender": "UserGender",
  "yearOfBirth": number,
  "languages": ["string"],
  "country": "string",
  "location": { ... }
}
```

**Response**:
```json
{
  "user": { ... }
}
```

---

### 3. `uploadUserAvatar`

**Purpose**: Uploads and stores a user's profile avatar image.

**Endpoint**: `POST /user/{id}/avatar`

**Authentication**: Required (Cognito JWT)

**Flow**:
1. Validates user ID from path parameters
2. Parses base64-encoded image data from request body
3. Uploads image to S3 bucket
4. Updates user's avatar URL in DynamoDB
5. Updates profile section status to "completed"

**Key Features**:
- Accepts base64-encoded image data
- Stores images in S3 with user-specific paths
- Automatically updates profile completion status
- Returns public URL for the uploaded image

**Request Body**:
```json
{
  "imageData": "base64-encoded-string",
  "contentType": "image/jpeg" | "image/png" | "image/webp"
}
```

**Response**:
```json
{
  "avatar": "https://s3.amazonaws.com/bucket/path/to/image.jpg"
}
```

---

### 4. `setUserGroupPersonalExperienceFromText`

**Purpose**: Allows users to submit their group personal experience as direct text input.

**Endpoint**: `POST /user/{id}/groupPersonalExperienceFromText`

**Authentication**: Required (Cognito JWT)

**Flow**:
1. Validates user ID from path parameters
2. Parses JSON body and extracts `personalExperience` field
3. Validates that `personalExperience` is a non-empty string
4. Updates user's group personal experience in DynamoDB

**Key Features**:
- Direct text input (no AI processing required)
- Fast response time (no external API calls)
- Validates non-empty text input
- Simple JSON request/response

**Request Body**:
```json
{
  "personalExperience": "I love hiking on weekends and enjoy deep conversations..."
}
```

**Response**:
```json
{
  "groupPersonalExperience": "I love hiking on weekends and enjoy deep conversations..."
}
```

---

### 5. `setUserGroupPersonalExperienceFromVoice`

**Purpose**: Allows users to submit their group personal experience via voice note (audio file).

**Endpoint**: `POST /user/{id}/groupPersonalExperienceFromVoice`

**Authentication**: Required (Cognito JWT)

**Flow**:
1. Validates user ID from path parameters
2. Parses multipart/form-data request
3. Extracts audio file from multipart data
4. Writes audio file to temporary storage (`/tmp`)
5. Transcribes audio using OpenAI Whisper API
6. Updates user's group personal experience with transcription
7. Cleans up temporary audio file

**Key Features**:
- Accepts multipart/form-data with audio file
- Uses OpenAI Whisper for transcription
- Supports base64-encoded request bodies
- Automatic cleanup of temporary files
- Requires `OPENAI_API_KEY` environment variable

**Request**:
- Content-Type: `multipart/form-data`
- Body: Audio file (e.g., `.m4a`, `.mp3`, `.wav`)

**Response**:
```json
{
  "groupPersonalExperience": "Transcribed text from audio..."
}
```

**Dependencies**:
- OpenAI API (for transcription)
- Busboy (for multipart parsing)
- File system access (for temporary storage)

---

### 6. `setUserGroupInsights`

**Purpose**: Updates user's group insights (AI-generated personality insights).

**Endpoint**: `POST /user/{id}/groupInsights`

**Authentication**: Required (Cognito JWT)

**Flow**:
1. Validates user ID from path parameters
2. Parses JSON body and extracts `insights` array
3. Validates that `insights` is a non-empty array
4. Updates user's group insights in DynamoDB

**Key Features**:
- Accepts array of insight strings
- Validates array structure
- Currently stores insights directly (AI generation commented out)

**Request Body**:
```json
{
  "insights": [
    "Enjoys outdoor activities",
    "Prefers small group settings",
    "Values meaningful conversations"
  ]
}
```

**Response**:
```json
{
  "statusCode": 200
}
```

**Note**: OpenAI integration for generating insights is currently commented out but can be enabled.

---

### 7. `setUserProfileSectionStatus`

**Purpose**: Updates the completion status of a specific profile section.

**Endpoint**: `POST /user/{id}/profileSectionStatus`

**Authentication**: Required (Cognito JWT)

**Flow**:
1. Validates user ID from path parameters
2. Parses JSON body for `section` and `value`
3. Validates section key against allowed values
4. Validates status value against allowed values
5. Updates profile section status in DynamoDB

**Key Features**:
- Type-safe section and status validation
- Supports all profile sections:
  - `personalInformation`
  - `avatar`
  - `groupPersonalExperience`
  - `groupInsights`
- Status values: `pending`, `completed`, `skipped`

**Request Body**:
```json
{
  "section": "avatar",
  "value": "completed"
}
```

**Response**:
```json
{
  "section": "avatar",
  "value": "completed"
}
```

---

## Data Flow

### User Onboarding Flow

```
1. User Registration (Cognito)
   ↓
2. POST /user (insertUser)
   - Creates user profile
   - Sets initial statuses
   ↓
3. POST /user/{id}/avatar (uploadUserAvatar)
   - Uploads avatar image
   - Updates avatar status
   ↓
4. POST /user/{id}/groupPersonalExperienceFromText (or FromVoice)
   - Submits personal experience
   - Updates experience status
   ↓
5. POST /user/{id}/groupInsights (setUserGroupInsights)
   - Sets group insights
   - Updates insights status
   ↓
6. Profile Complete
```

### Data Models

#### UserDTO (API Contract)
```typescript
{
  id: string,
  name: string,
  surname: string,
  gender: UserGender,
  country?: string,
  location?: LocationData,
  yearOfBirth: number,
  languages: string[],
  avatar?: string,
  groupProfile: {
    insights?: string[],
    personalExperience?: { description: string },
    behavior?: { description: string, factors: GroupBehaviorFactors }
  },
  match?: { id: string },
  profileSectionsStatus: Record<ProfileSectionKey, ProfileSectionStatus>
}
```

#### UserEntity (Database Model)
```typescript
{
  id: string,
  ownerId: string,  // Cognito user ID
  name: string,
  surname: string,
  gender: UserGender,
  // ... (similar to UserDTO)
  needsGroupBehaviorUpdate: BooleanString,
  isMatched: BooleanString,
  profileSectionsStatus: Record<ProfileSectionKey, ProfileSectionStatus>
}
```

---

## Technology Stack

### Core Technologies

- **TypeScript** - Primary programming language
- **Node.js** - Runtime environment
- **AWS SDK v3** - AWS service integration
  - `@aws-sdk/lib-dynamodb` - DynamoDB operations
  - `@aws-sdk/client-s3` - S3 operations
- **OpenAI API** - AI-powered features
- **Busboy** - Multipart form data parsing

### Data Storage

- **DynamoDB Table**: `Users`
  - Primary Key: `id`
  - Global Secondary Index: `ownerId-index`
- **S3 Bucket**: User avatar storage
- **Pinecone** (optional): Vector database for embeddings

### Environment Variables

Required environment variables:
- `OPENAI_API_KEY` - OpenAI API authentication
- `PINECONE_KEY` - Pinecone API key (optional)
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_REGION` - AWS region configuration

---

## Authentication & Authorization

### Cognito JWT Integration

All Lambda functions (except public endpoints) require AWS Cognito authentication:

1. **Token Extraction**: User ID extracted from JWT claims
   ```typescript
   const ownerId = event.requestContext?.authorizer?.jwt?.claims?.sub;
   ```

2. **Authorization**: Functions validate that:
   - JWT token is present and valid
   - User ID matches the authenticated user
   - User has permission to access the resource

3. **Error Responses**:
   - `401 Unauthorized` - Missing or invalid token
   - `403 Forbidden` - User lacks permission

### Security Best Practices

- User IDs are always extracted from JWT (never trusted from request body)
- Path parameters validated before processing
- Input validation on all user-provided data
- No sensitive data in logs or error messages

---

## Error Handling

### Standard Error Response Format

All Lambda functions follow a consistent error response pattern:

```typescript
{
  statusCode: number,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Error description",
    error?: "Detailed error message"
  })
}
```

### HTTP Status Codes

- **200 OK** - Successful operation
- **400 Bad Request** - Invalid input or missing required fields
- **401 Unauthorized** - Authentication required or failed
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server-side error

### Error Categories

1. **Validation Errors** (400)
   - Missing required fields
   - Invalid data types
   - Empty or null values

2. **Authentication Errors** (401)
   - Missing JWT token
   - Invalid token
   - User ID not found in token

3. **Not Found Errors** (404)
   - User not found in database
   - Resource doesn't exist

4. **Server Errors** (500)
   - Database connection failures
   - External API failures
   - Unexpected exceptions

---

## Deployment

### Build Process

1. **Compile TypeScript**:
   ```bash
   npm run build
   ```

2. **Install Dependencies**:
   ```bash
   npm i --production
   rm -fr build/node_modules && cp -fr node_modules build
   ```

3. **Create Deployment Package**:
   ```bash
   cd build
   zip -r ../lambda_package.zip ./*
   ```

### Lambda Configuration

Each Lambda function should be configured with:
- **Runtime**: Node.js 18.x or later
- **Handler**: `{functionName}.handler`
- **Timeout**: 30 seconds (voice transcription may need more)
- **Memory**: 256 MB (512 MB for voice transcription)
- **Environment Variables**: As listed above
- **IAM Role**: Permissions for DynamoDB, S3, and CloudWatch Logs

---

## Future Enhancements

### Planned Features

1. **AI-Powered Insights Generation**
   - Automatic generation of group insights from personal experience
   - Integration with OpenAI for behavior analysis

2. **Matching Engine**
   - Agent-based group formation
   - AI-powered compatibility analysis
   - Dynamic group suggestions

3. **Enhanced Validation**
   - Request body schema validation
   - Type-safe DTO validation
   - Input sanitization

4. **Performance Optimization**
   - Response caching
   - Connection pooling
   - Batch operations

---

## Maintenance Notes

### Code Quality

- All functions use TypeScript for type safety
- Consistent error handling patterns
- Comprehensive logging for debugging
- Clear separation of concerns

### Monitoring

- CloudWatch Logs for all Lambda executions
- Error tracking and alerting
- Performance metrics monitoring
- Cost optimization tracking

---

**Last Updated**: 2024
**Version**: 1.0
**Maintained By**: MatchMe Development Team

