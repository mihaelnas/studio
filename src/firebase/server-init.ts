
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This function is specifically for server-side initialization.
// It ensures that Firebase is initialized only once.
export function initializeFirebaseServer() {
  const apps = getApps();
  if (apps.length) {
    return getSdks(getApp());
  }

  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}

function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  return {
    firebaseApp,
    auth,
    firestore
  };
}
