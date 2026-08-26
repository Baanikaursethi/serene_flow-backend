# Serene Flow - Firebase NestJS Backend API

Backend server built with NestJS and Firebase (Cloud Firestore, Firebase Auth, Firebase Storage) to power the Serene Flow mental health and well-being application.

---

## 🛠️ Setup & Configuration

1. Locate the backend directory:
```bash
cd sereneflow-backend
```

2. Configure environment variables in `.env`:
```env
PORT=3000
FIREBASE_PROJECT_ID=sereneflow-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@sereneflow-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=sereneflow-app.appspot.com
CEO_EMAIL=sereneflow27@gmail.com
JWT_SECRET=super-secret-serene-flow-jwt-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sereneflow27@gmail.com
SMTP_PASS=your-app-password
```

---

## 💻 Running Locally

### Option 1: Direct NestJS Local Dev Mode *(Recommended & Fastest)*
Runs the server directly on `http://localhost:3000` with hot-reloading:
```bash
# Start NestJS development server
npm run start:dev
```
- Server URL: `http://localhost:3000`
- Reads `.env` and automatically uses in-memory/hybrid fallback if production Firebase keys are unconfigured.

### Option 2: Firebase Local Emulator Suite
Emulate Firebase Cloud Functions, Firestore, and Auth locally:
```bash
# Build & start Firebase Local Emulator Suite
npm run serve
```
*or directly:*
```bash
npx firebase emulators:start
```
- **Emulator UI Dashboard**: `http://localhost:4000` *(visual Firestore DB & Auth inspector)*
- **Functions Base URL**: `http://localhost:5001/sereneflow-app/us-central1/api/`
- **Firestore Emulator**: `localhost:8080`
- **Auth Emulator**: `localhost:9099`

---

## 🚀 Deploying to Firebase

Deploy NestJS as a 2nd Gen HTTP Cloud Function (`api`):

1. **Log in to Firebase CLI**:
```bash
npx firebase login
```

2. **Select / Link your Firebase Project**:
```bash
npx firebase use --add
```

3. **Deploy Functions**:
```bash
# Deploy to Firebase Functions
npm run deploy
```
*or:*
```bash
npx firebase deploy --only functions
```

After deployment, your live API endpoint URL will be:
`https://us-central1-<YOUR-PROJECT-ID>.cloudfunctions.net/api`

---

## 📚 API Endpoint Reference

### 1. Authentication (`/auth`)
- `POST /auth/signup` — Create a new account & trigger email verification code.
- `POST /auth/login` — Authenticate user and return JWT / Firebase token.
- `POST /auth/logout` — End user session.
- `POST /auth/forgot-password` — Send password reset link/token from official email (`sereneflow27@gmail.com`).
- `POST /auth/reset-password` — Set a new password using reset token.
- `POST /auth/verify-email` — Verify account using verification code.
- `POST /auth/resend-verification` — Resend email verification code.

### 2. User & Profile (`/users`)
- `GET /users/me` — Retrieve current user profile, streaks, and personal statistics.
- `PATCH /users/me` — Update display name and personal preferences.
- `PATCH /users/me/avatar` — Update user profile picture.
- `DELETE /users/me` — Permanently delete user account, private journals, and mood history.
- `POST /users/me/activity` — Log user activity and update `lastActive` timestamp.

### 3. Journal (`/journal`)
- `GET /journal` — Fetch private journal entries for the current user.
- `POST /journal` — Create a journal entry (with automatic deduplication).
- `PATCH /journal/:id` — Edit an owned journal entry.
- `DELETE /journal/:id` — Delete an owned journal entry.

### 4. Mood (`/moods`)
- `GET /moods` — Retrieve user's complete mood check-in history.
- `POST /moods` — Save a new mood check-in.
- `GET /moods/latest` — Retrieve the most recent mood check-in.
- `GET /moods/trends` — Retrieve calculated mood trends, streaks, averages, and distribution for charts.

### 5. Spaces Community (`/spaces`)
- `GET /spaces/posts` — Retrieve community posts.
- `POST /spaces/posts` — Create a community post (with pre-moderation scan).
- `PATCH /spaces/posts/:id` — Edit own post (server-side author check).
- `DELETE /spaces/posts/:id` — Delete post (author or CEO override).
- `POST /spaces/posts/:id/reactions` — Add or toggle post reactions.
- `POST /spaces/posts/:id/replies` — Add a reply to a community post.
- `GET /spaces/posts/:id/replies` — Retrieve all replies for a post.

### 6. Admin / CEO (`/admin`)
- Restricted exclusively to CEO account (`sereneflow27@gmail.com`).
- `GET /admin/users` — List registered users and activity statistics.
- `GET /admin/logs` — View system authentication and activity logs.
- `GET /admin/stats` — Dashboard statistics (total users, active today, journals, moods, posts).
- `DELETE /admin/spaces/posts/:id` — Moderation endpoint to force-delete any post.

### 7. Moderation (`/moderation`)
- `POST /moderation/spaces` — Pre-check content for restricted/harmful text before publishing.
