// Firebase Admin SDK initialization for Firestore
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';
import storage from './storage';

const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';

let db: any = null;
if (!USE_LOCAL_DB) {
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  }
  db = admin.firestore();
}

export function getDb(): any {
  return storage;
}
// Now you can import db from this file to use Firestore in your backend 