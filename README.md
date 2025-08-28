# Assets Creator

A Vue.js application for creating and managing project assets with AI-powered prompt generation.

## Features

- Create and manage projects
- Generate AI-powered prompts for different asset types (images, text, video, audio)
- File-based storage using JSON files
- Google Gemini AI integration

## Setup

### Backend (File Storage Server)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The backend server will run on `http://localhost:3001` and create JSON files in `backend/storage/`.

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy).

## Storage

Data is stored in JSON files located at:
- `backend/storage/projects.json` - Project data
- `backend/storage/assets.json` - Asset data

The system automatically:
- Loads data from these files on startup
- Saves changes immediately to the files
- Uses localStorage as a fallback if the backend is unavailable

## AI Configuration

1. Go to Settings in the app
2. Add your Google Gemini API key
3. Select your preferred model
4. Test the connection to verify it works

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## Development

- Backend: Simple Express.js server with file-based storage
- Frontend: Vue 3 with TypeScript, Tailwind CSS, and Pinia for state management
- Storage: JSON files with automatic backup to localStorage