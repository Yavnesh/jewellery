import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";

function formatPrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

export function getFirebaseAdminApp() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vamika-jewels";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk@vamika-jewels.iam.gserviceaccount.com";
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    try {
      if (privateKey) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        // Fallback initialization for development without crash
        initializeApp({
          projectId,
        });
      }
    } catch (e: any) {
      console.warn("Firebase Admin initializeApp warning:", e.message);
    }
  }

  return getApp();
}

export const adminAuth = () => {
  try {
    const app = getFirebaseAdminApp();
    return getAuth(app);
  } catch {
    return null;
  }
};

export const adminMessaging = () => {
  try {
    const app = getFirebaseAdminApp();
    return getMessaging(app);
  } catch {
    return null;
  }
};
