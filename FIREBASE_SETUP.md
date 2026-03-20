# Firebase setup (do this once)

**Only edit `firebase-config.js`** — paste your keys there. Do **not** change `firebase-client.js` (keep `null` on lines 11–14).

---

## Part A — Create the project (Firebase Console)

1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Name it (e.g. `good-knight-boutique`) → Continue → disable Google Analytics if you want → **Create project**.

---

## Part B — Register a Web App and get your config

1. On the project overview, click the **Web** icon `</>` (Add app).
2. Nickname: e.g. `boutique-site` → **Register app**.
3. Firebase shows **SDK setup** — choose **npm** is wrong for you; use the **Config** object.
4. Copy the `firebaseConfig` object. It looks like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc..."
};
```

5. Open **`firebase-config.js`** in this project and paste **only the values** into the existing `export const firebaseConfig = { ... }` (keep `export` and the filename).

---

## Part C — Authentication

1. Firebase Console → **Build** → **Authentication** → **Get started**.
2. **Sign-in method** → **Email/Password** → **Enable** → Save.
3. Shelby will create her account on **`admin.html`** (first time only), or you add a user under **Users** tab.

---

## Part D — Firestore Database

1. **Build** → **Firestore Database** → **Create database**.
2. Start in **production mode** (we’ll add rules next) → pick a region → **Enable**.
3. **Rules** tab → paste contents of **`firestore.rules`** from this repo → **Publish**.

---

## Part E — Storage (product images)

1. **Build** → **Storage** → **Get started** → **Next** → **Done**.
2. **Rules** tab → paste contents of **`storage.rules`** from this repo → **Publish**.

---

## Part F — Authorized domains (GitHub Pages)

1. **Authentication** → **Settings** → **Authorized domains**.
2. Add:
   - `eldritchrage.github.io` (or your exact GitHub Pages domain)
   - `localhost` is usually already there for local testing.

---

## Part G — Deploy to GitHub

Upload or push **all** project files including updated **`firebase-config.js`** to your repo root. Wait 1–3 minutes for GitHub Pages.

---

## Checklist

| Step | Done? |
|------|--------|
| `firebase-config.js` filled (not `REPLACE_ME`) | ☐ |
| Email/Password enabled | ☐ |
| Firestore created + rules published | ☐ |
| Storage created + rules published | ☐ |
| GitHub Pages domain in Authorized domains | ☐ |
| Site files pushed to GitHub | ☐ |

---

## If something breaks

- **Admin shows “Firebase Setup Required”** → config still has `REPLACE_ME` or a typo in `firebase-config.js`.
- **`enable is not defined`** → you edited `firebase-client.js`; restore `let auth = null;` and `let storage = null;`.
- **Permission denied** → Firestore/Storage rules not published or user not signed in.

---

## I can’t access your account

If you want help pasting config safely: copy **only** the `firebaseConfig` block from Firebase (no passwords), and someone technical can paste it into `firebase-config.js` for you. **Never share** your Google password or private keys.
