# PetChat AI 🐾

A full-stack roleplay chat application where pets come to life with Gemini 2.0 Flash.

## ✨ Features

- **Unique Pet Personas**: Generates rich AI prompts based on your pet's type, traits, and quirks.
- **Real-time Chat**: Immersive chat interface with personality-driven responses.
- **Multi-Pet Management**: Create and manage multiple pet profiles.
- **Serverless Backend**: Powered by FastAPI, Firestore, and Google Cloud Run.
- **Premium UI**: Modern glassmorphism design with Framer Motion animations.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, Firebase Auth
- **Backend**: FastAPI (Python), Google Cloud Firestore
- **AI Engine**: Gemini 2.0 Flash

---

## 🚀 Setup Instructions

### 1. Backend Setup
The backend is already configured and tested!
- **Directory**: `backend/`
- **Run Locally**: `source venv/bin/activate && python main.py`
- **Environment**: `.env` file contains your Project ID and Gemini API Key.

### 2. Frontend Setup
1. **Directory**: `frontend/`
2. **Install Dependencies**: `npm install`
3. **Configure Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com/project/vsmplco/settings/general)
   - Add a "Web" app to your project.
   - Copy the `firebaseConfig` object.
   - Create a `frontend/.env.local` file with the following:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vsmplco.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=vsmplco
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vsmplco.firebasestorage.app
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
     
     NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
     ```
4. **Enable Authentication**:
   - In Firebase Console, go to **Authentication > Sign-in method**.
   - Enable **Email/Password** and **Google**.
5. **Run Locally**: `npm run dev`

### 3. Usage
- Go to `http://localhost:3000/login`
- Create an account or sign in.
- Create your first pet (like Buster!).
- Start chatting!

---

## 📈 Architecture & Free Tier
- **Gemini 2.0 Flash**: 15 Requests Per Minute (Free).
- **Firestore**: 1GB Storage / 50K Reads / 20K Writes (Free).
- **Hosting**: Vercel (Frontend) & Cloud Run (Backend) meet Free Tier limits.

Enjoy chatting with your pets! 🐾
