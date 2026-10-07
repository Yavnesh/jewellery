import admin from "firebase-admin";

function formatPrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

export function getFirebaseAdminApp() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vamika-jewels";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk@vamika-jewels.iam.gserviceaccount.com";
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    try {
      if (privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        // Fallback initialization for development without crash
        admin.initializeApp({
          projectId,
        });
      }
    } catch (e: any) {
      console.warn("Firebase Admin initializeApp warning:", e.message);
    }
  }

  return admin.app();
}

export const adminAuth = () => {
  try {
    getFirebaseAdminApp();
    return admin.auth();
  } catch {
    return null;
  }
};

export const adminMessaging = () => {
  try {
    getFirebaseAdminApp();
    return admin.messaging();
  } catch {
    return null;
  }
};
