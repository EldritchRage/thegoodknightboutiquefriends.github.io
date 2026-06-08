import { auth, isFirebaseReady } from "./firebase-client.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

export function isAuthConfigured() {
  return isFirebaseReady && Boolean(auth);
}

export function watchAuth(callback) {
  if (!isAuthConfigured()) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function requireAuth(loginPath = "login.html", returnPath = "buy.html") {
  return new Promise((resolve) => {
    if (!isAuthConfigured()) {
      console.error("Firebase Auth is not configured");
      window.location.href = loginPath;
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (!user) {
        const next = encodeURIComponent(returnPath || "buy.html");
        window.location.href = `${loginPath}?next=${next}`;
        return;
      }
      resolve(user);
    });
  });
}

export async function signIn(email, password) {
  if (!isAuthConfigured()) {
    throw new Error("Firebase Auth is not configured");
  }
  return signInWithEmailAndPassword(auth, email, password);
}

export async function register(email, password) {
  if (!isAuthConfigured()) {
    throw new Error("Firebase Auth is not configured");
  }
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logOut() {
  if (!isAuthConfigured()) {
    return;
  }
  await signOut(auth);
}

export function getLoginRedirectUrl(defaultPath = "buy.html") {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (!next || next.includes("://") || next.startsWith("//")) {
    return defaultPath;
  }
  return next;
}
