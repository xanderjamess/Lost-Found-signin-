import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let _db: ReturnType<typeof getFirestore> | null = null;
try {
  _db = (firebaseConfig as any).firestoreDatabaseId
    ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
    : getFirestore(app);
} catch (e: any) {
  // Provide a clearer console message to help debugging when the Firestore
  // instance is not available (project misconfigured or Firestore not enabled).
  // Common causes:
  // - `projectId` in `firebase-applet-config.json` is incorrect
  // - Firestore hasn't been created/enabled in the Firebase Console
  // - The project uses Datastore mode instead of Firestore native
  console.error(
    'Failed to initialize Firestore. Please check your Firebase project configuration and ensure Firestore is enabled. Details:',
    e
  );
}

export const db = _db;
export const auth = getAuth(app);
