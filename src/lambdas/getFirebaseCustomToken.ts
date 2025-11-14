import * as admin from 'firebase-admin';

// Singleton pattern to prevent re-initialization on subsequent Lambda invocations
let firebaseApp: admin.app.App | null = null;

function initializeFirebaseAdmin(): admin.app.App {
    if (firebaseApp) {
        console.log('Firebase Admin already initialized, reusing existing instance.');
        return firebaseApp;
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log('Firebase Admin SDK initialized successfully with project:', serviceAccount.project_id);
        return firebaseApp;
    } catch (error: any) {
        console.error('Error initializing Firebase Admin SDK:', error);
        throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
}

async function ensureFirebaseUserExists(auth: admin.auth.Auth, uid: string): Promise<void> {
    try {
        await auth.getUser(uid);
        console.log(`Firebase Auth user already exists for UID: ${uid}`);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log(`Firebase Auth user not found for UID ${uid}. Creating new user...`);
            try {
                await auth.createUser({ uid });
                console.log(`Firebase Auth user created for UID: ${uid}`);
            } catch (createError: any) {
                if (createError.code === 'auth/uid-already-exists') {
                    // Possible race condition where user was created between getUser and createUser
                    console.warn(`UID ${uid} already exists when attempting to create. Proceeding.`);
                } else {
                    console.error(`Failed to create Firebase Auth user for UID ${uid}:`, createError);
                    throw createError;
                }
            }
        } else {
            console.error(`Failed to lookup Firebase Auth user for UID ${uid}:`, error);
            throw error;
        }
    }
}

export const handler = async (event: any) => {
    try {
        console.log("Received event for Firebase Custom Token generation");

        // Extract Cognito user ID from JWT
        const cognitoSub = event.requestContext?.authorizer?.jwt?.claims?.sub;

        if (!cognitoSub) {
            console.error("Missing Cognito sub in JWT claims");
            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: "Unauthorized: User ID not found in token." 
                }),
            };
        }

        console.log(`Ensuring Firebase Auth user exists for Cognito user: ${cognitoSub}`);

        // Initialize Firebase Admin SDK (singleton pattern)
        const app = initializeFirebaseAdmin();
        const auth = admin.auth(app);

        // Ensure the Firebase user exists (create if missing)
        await ensureFirebaseUserExists(auth, cognitoSub);

        console.log(`Minting Firebase Custom Token for Cognito user: ${cognitoSub}`);

        // Create custom token using Cognito sub as the Firebase UID
        const firebaseToken = await auth.createCustomToken(cognitoSub);

        console.log(`Successfully minted Firebase Custom Token for user: ${cognitoSub}`);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firebaseToken: firebaseToken
            }),
        };

    } catch (error: any) {
        console.error("Error minting Firebase Custom Token:", error);

        // Handle specific Firebase errors
        if (error.code === 'auth/invalid-argument') {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: "Invalid argument for token creation.",
                    error: error.message
                }),
            };
        }

        if (error.code === 'auth/internal-error') {
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: "Firebase internal error occurred.",
                    error: error.message
                }),
            };
        }

        // Generic error response
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Internal server error.",
                error: error.message || "Unknown error"
            }),
        };
    }
};

