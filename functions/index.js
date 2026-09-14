const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const { handleGeminiRequest } = require("./geminiHandlers");

/**
 * Cloud Function: generateCustomToken
 * 
 * Takes a Firebase ID token from the relay page (where user signed in via Google),
 * verifies it, and returns a custom token that the Tauri desktop app can use
 * with signInWithCustomToken() to establish a Firebase Auth session.
 */
exports.generateCustomToken = functions.https.onRequest(async (req, res) => {
    // CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const { idToken } = req.body;
    if (!idToken) {
        res.status(400).json({ error: "idToken is required" });
        return;
    }

    try {
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Generate a custom token for this user
        const customToken = await admin.auth().createCustomToken(uid);

        res.status(200).json({ customToken });
    } catch (error) {
        console.error("Error generating custom token:", error);
        res.status(401).json({ error: "Invalid ID token" });
    }
});

/**
 * Cloud Function: geminiProxy (onCall)
 * 
 * Universal proxy for all Gemini AI requests.
 * - Requires authenticated Firebase user
 * - API key stored in functions.config().gemini.key
 * - Accepts { action: string, payload: object }
 * - Routes to the appropriate handler in geminiHandlers.js
 */
exports.geminiProxy = functions
    .runWith({ timeoutSeconds: 120, memory: "512MB" })
    .https.onCall(async (data, context) => {
        // Auth check — onCall automatically verifies Firebase Auth token
        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "Authentication required to use AI features."
            );
        }

        const { action, payload } = data;

        if (!action || typeof action !== "string") {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Missing or invalid 'action' parameter."
            );
        }

        // Get API key from environment variable (.env file in functions/)
        const apiKey = process.env.GEMINI_KEY;
        if (!apiKey) {
            console.error("GEMINI_KEY not set. Create functions/.env with GEMINI_KEY=your_key");
            throw new functions.https.HttpsError(
                "failed-precondition",
                "AI service not configured on server."
            );
        }

        try {
            const result = await handleGeminiRequest(apiKey, action, payload || {});
            return { success: true, data: result };
        } catch (error) {
            console.error(`geminiProxy error [${action}]:`, error.message);
            throw new functions.https.HttpsError(
                "internal",
                `AI request failed: ${error.message}`
            );
        }
    });
