# FileStore App v3.0 — Firebase Edition

This version uses **Firebase** (Auth, Firestore, Storage) instead of Supabase.

## What's Included

| Feature | Status |
|---|---|
| Email/password auth + password reset | Firebase Auth |
| Customer & admin accounts with roles | Firestore `profiles` |
| File upload (GB-sized files) | Firebase Storage |
| Payment requests + admin approve/reject | Firestore `payment_requests` |
| Access grants + revoke | Firestore `access_grants` |
| Download tracking | Firestore `downloads` |
| Push notifications | expo-notifications, token stored in Firestore |
| Revenue tracker, search, edit file, customer detail | All included |

## Setup

### 1. Create a Firebase Project

1. Go to **console.firebase.google.com** → click **Add project**
2. Give it a name (e.g. `filestore-app`) → continue through the steps → create

### 2. Enable Authentication

1. In your Firebase project, click **Build → Authentication** → **Get started**
2. Click **Email/Password** → toggle it **Enable** → Save

### 3. Create Firestore Database

1. Click **Build → Firestore Database** → **Create database**
2. Choose **Start in production mode** → pick a location close to you → Enable
3. Go to the **Rules** tab → delete everything → paste the contents of `firebase/firestore.rules` from this project → **Publish**

### 4. Create Storage Bucket

1. Click **Build → Storage** → **Get started** → choose production mode → Enable
2. Go to the **Rules** tab → delete everything → paste the contents of `firebase/storage.rules` from this project → **Publish**

### 5. Register a Web App (to get your config keys)

1. In Project Overview, click the **web icon (`</>`)** to add a web app
2. Give it a nickname (e.g. `filestore-web`) → Register app
3. Copy the `firebaseConfig` values shown — you'll need these next

### 6. Fill in your `.env` file

Open `.env` in this project and paste in your Firebase values:

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
EXPO_PUBLIC_ADMIN_PHONE=+255 712 XXX XXX
EXPO_PUBLIC_PAYMENT_NAME=Your Full Name
```

Also set the **same values** as Environment Variables on **expo.dev** (Project → Environment Variables) if you're building via the website/GitHub method.

### 7. Make Yourself Admin

1. Register an account in the app using your admin email
2. In Firebase Console, go to **Firestore Database** → **profiles** collection
3. Click on the document with your user ID → find the `role` field → change its value from `customer` to `admin` → Update
4. Sign out and sign back in — you'll now see the Admin panel

## Build APK

Same process as before — via **eas-cli** in a terminal, or via **expo.dev website + GitHub** with zero terminal (see prior guidance). Your `eas.json` and `app.json` are already configured with your project ID and team owner.

## Data Model (Firestore Collections)

```
profiles/{uid}            full_name, email, phone, role, created_at, push_token
files/{autoId}             title, description, price, category, file_path, file_url, file_name, is_active, created_at
payment_requests/{autoId}  user_id, file_id, payment_reference, amount, status, created_at
access_grants/{autoId}     user_id, file_id, created_at
downloads/{autoId}         user_id, file_id, downloaded_at
```
