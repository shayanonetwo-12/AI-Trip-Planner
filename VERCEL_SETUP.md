# Deploying WanderAI on Vercel

### 1. Vercel Serverless API Routes
The codebase now includes native Vercel Serverless Functions in the `/api` directory (`/api/generate-itinerary.ts` and `/api/chat.ts`) along with `vercel.json` configuration.

### 2. Required Environment Variables on Vercel
In your Vercel Project Dashboard:
1. Go to **Settings** -> **Environment Variables**.
2. Add `GEMINI_API_KEY`:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key (from Google AI Studio: https://aistudio.google.com/app/apikey)
3. (Optional) Add your Firebase config if using your own custom Firebase project:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 3. Redeploy
After adding the `GEMINI_API_KEY` environment variable in Vercel:
1. Go to **Deployments** tab in Vercel.
2. Click **Redeploy** (or push a new commit to your GitHub repository).
