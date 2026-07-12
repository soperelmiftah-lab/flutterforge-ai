/**
 * @module features/integrations/firebase
 *
 * Firebase adapter — Auth, Firestore, Storage, and Crashlytics wiring for
 * generated Flutter apps. Planned (Phase 4).
 */

export interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  appId: string;
  messagingSenderId?: string;
  storageBucket?: string;
}

export const firebaseConfig: FirebaseConfig | null = null;

/** Link a Firebase project. NOT IMPLEMENTED in Phase 1. */
export async function linkFirebase(_config: FirebaseConfig): Promise<void> {
  throw new Error("Firebase integration arrives in Phase 4.");
}
