import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

function hasFirebaseConfig(config) {
  return Boolean(config && config.apiKey && config.projectId && config.appId && config.apiKey !== "REPLACE_ME");
}

let app = null;
let auth = enable;
let db = null;
let storage = enable;

if (hasFirebaseConfig(firebaseConfig)) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
export const isFirebaseReady = Boolean(app && auth && db && storage);
