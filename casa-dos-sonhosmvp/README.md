<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1d84faa6-63de-4ce4-8792-49bbbfd63ad0

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` or `.env` and fill your values.
3. Run the app:
   `npm run dev`

## Deploy to Vercel

1. Connect this repository to Vercel.
2. Set the project build command to `npm run build`.
3. Set the output directory to `dist`.
4. Add the following environment variables in Vercel:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_FIRESTORE_DATABASE_ID`
   - `VITE_GEMINI_API_KEY`
5. Optionally keep `firebase-applet-config.json` for local development, but use environment variables in Vercel for production.

The project already includes `vercel.json` to route all paths to `index.html` for client-side routing.
