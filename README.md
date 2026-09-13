# 🌌 NOVA AI Assistant — Full-Stack Conversational Intelligence Platform

NOVA is a production-ready, full-stack AI Assistant application designed with modern SaaS aesthetics, planetary visual themes, and an enterprise multi-model AI pipeline. Built with **React 18**, **Vite**, **Python FastAPI**, **Google Gemini**, **Groq**, and **Firebase (Auth & Firestore)**.

---

## ✨ Features & Capabilities

### ⚡ Dual-Engine AI Architecture & Silent Fallback
- **Google Gemini API**: Powered by `gemini-3.8-flash` for high-throughput, low-latency reasoning and conversational flow.
- **Groq Integration**: Powered by `openai/gpt-oss-120b` (and `openai/gpt-oss-20b`) for lightning-fast inference.
- **Auto Provider Selection**: Dynamically routes requests, featuring a **silent backend fallback** (Gemini → Groq) with automatic stream reset if primary rate limits or network issues occur.
- **Real-Time Token Streaming**: Streams AI responses using Server-Sent Events (`text/event-stream`) with client-side cancellation via `AbortController`.

### 🔐 Authentication & Persistent Cloud Storage
- **Firebase Authentication**: Full Google OAuth one-tap sign-in and secure email/password registration with token session persistence.
- **Firestore Persistence**: Conversations, messages, and timestamps are saved in Firestore, persisting across browser refreshes and device sessions.
- **Conversation Management**: Rename chat titles with inline validation, permanent chat deletion with confirmation modals, and automatic AI-driven smart titles.

### 🎨 Premium Visual Design & Theming
- **Cinematic Planetary Themes**: Atmospheric cosmic backgrounds tailored per view — Earth (Chat), Mars (Explore), Venus (Templates), Jupiter (Library), and Saturn (Settings).
- **Responsive SaaS Interface**: Optimized across 4K displays, laptops, tablets, and mobile smartphones with responsive collapsible drawers and custom touch interactions.
- **Rich Markdown & Code Rendering**: Fenced code blocks with language badges, one-click copy buttons, formatted tables, lists, and inline formatting.
- **Interactive Workspaces**:
  - **Explore**: Discover pre-built prompts categorized across Coding, Writing, Analysis, and Education.
  - **Templates**: Ready-to-use workflows for development, debugging, copywriting, and research.
  - **Library**: Save, organize, and search personal custom prompts.
  - **Global Quick Search**: Keyboard shortcut (`Ctrl+K` / `Cmd+K`) modal to search and instantly jump to previous conversations.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              React 18 + Vite (Frontend)                 │
│   • Tailwind-free Vanilla CSS Design System             │
│   • Firebase Auth & Firestore Client SDK                │
│   • SSE Stream Reader (Fetch API + ReadableStream)      │
└────────────────────────────┬────────────────────────────┘
                             │
                  POST /api/chat/stream (SSE)
                             │
┌────────────────────────────▼────────────────────────────┐
│               FastAPI (Backend Gateway)                 │
│   • Request Validation & Sanitization (Pydantic v2)     │
│   • Server-Owned System Personas & History Truncation   │
│   • Dual-Engine AI Service (Gemini & Groq SDKs)         │
│   • Silent Mid-Stream Fallback Controller               │
└────────────────────────────┬────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│   Google Gemini API   │         │       Groq API        │
│  (gemini-3.8-flash)   │         │ (openai/gpt-oss-120b) │
└───────────────────────┘         └───────────────────────┘
```

---

## 📁 Repository Structure

```text
ai-chatbot/
│
├── frontend/                     # React 18 + Vite Frontend Application
│   ├── public/                   # Static assets, favicons & planetary backgrounds
│   │   └── assets/
│   │       └── backgrounds/      # Earth, Mars, Venus, Jupiter, Saturn artwork
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # Login, Signup, AuthModal
│   │   │   ├── backgrounds/      # SectionBackground ambient backdrop
│   │   │   ├── branding/         # NovaLogo vector components
│   │   │   ├── chat/             # ChatWindow, ChatInput, ChatMessage, CodeBlock, Modals
│   │   │   ├── explore/          # ExploreScreen category explorer
│   │   │   ├── layout/           # Sidebar & TopBar navigation
│   │   │   ├── library/          # LibraryScreen user saved prompts
│   │   │   ├── search/           # SearchModal (Ctrl+K conversation finder)
│   │   │   ├── settings/         # SettingsScreen account and appearance
│   │   │   └── templates/        # TemplatesScreen workflow library
│   │   ├── context/              # AuthContext (Firebase authentication state)
│   │   ├── services/             # chatApi, chatFirestore, storageFirestore, modelConfig
│   │   ├── App.jsx               # Main state orchestrator
│   │   ├── firebase.js           # Firebase app initialization
│   │   ├── index.css             # Complete NOVA Design System
│   │   └── main.jsx              # React DOM mounting
│   ├── .env.example              # Frontend environment template
│   ├── index.html                # HTML document root
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite build configuration
│
├── backend/                      # Python FastAPI API Server
│   ├── app/
│   │   ├── models/               # Pydantic v2 schemas (ChatMessage, ChatStreamRequest)
│   │   ├── routes/               # API endpoints (/health, /api/chat/stream)
│   │   ├── services/             # ai_service.py (Gemini & Groq multi-provider pipeline)
│   │   ├── config.py             # Safe settings manager using python-dotenv
│   │   ├── main.py               # FastAPI entry point & CORS configuration
│   │   └── __init__.py
│   ├── .env.example              # Backend environment template
│   └── requirements.txt          # Python dependencies
│
├── firestore.rules               # Cloud Firestore security rules
├── .env.example                  # Root environment reference
├── .gitignore                    # Production gitignore rules
└── README.md                     # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or later) & **npm**
- **Python** (v3.9 or later) & **pip**
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/app/apikey))
- **Groq API Key** (from [Groq Console](https://console.groq.com/keys))
- **Firebase Project** (with Authentication & Cloud Firestore enabled)

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your API keys:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualGeminiApiKey
   GEMINI_MODEL=gemini-3.8-flash

   GROQ_API_KEY=gsk_YourActualGroqApiKey
   GROQ_MODEL=openai/gpt-oss-120b

   PORT=8000
   HOST=127.0.0.1
   FRONTEND_URL=http://localhost:5173
   ```

5. Start the backend development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API will run at `http://127.0.0.1:8000` (Health check: `http://127.0.0.1:8000/health`).

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Firebase Web App credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_web_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🔒 Security Best Practices
- **Never expose AI API keys to the browser**: All Gemini and Groq API keys are handled exclusively on the backend server.
- **CORS Restricted**: Backend CORS policy is configured to only allow requests from authorized frontend origins.
- **Firestore Rules**: Strict user-level access isolation ensuring users can only read and write their own documents and message subcollections.

---

## 📦 Production Deployment

### Frontend (Vercel, Netlify, Cloudflare Pages)
```bash
cd frontend
npm run build
```
Deploy the generated `dist/` directory and configure your production environment variables (`VITE_API_BASE_URL` pointing to your deployed backend URL, and Firebase credentials).

### Backend (Render, Railway, Fly.io, AWS)
Run the ASGI server in production mode:
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
```
Ensure `GEMINI_API_KEY`, `GROQ_API_KEY`, and `FRONTEND_URL` are configured in your production host environment.

---

## 📄 License
This project is licensed under the MIT License.