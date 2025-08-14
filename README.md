# Asset Generation Tool

A web application for generating consistent visual assets with defined art styles.

## Project Structure

```
asset-generation-tool/
├── frontend/          # Vue.js frontend application
├── backend/           # Node.js/Express backend API
├── package.json       # Root package.json for workspace management
└── README.md         # This file
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Quick Start

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Update MongoDB connection string in `backend/.env` if needed

3. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start both frontend (http://localhost:5173) and backend (http://localhost:3000) servers.

## Development

### Frontend (Vue.js)
- **Location:** `./frontend`
- **Tech Stack:** Vue 3, TypeScript, Vite, Tailwind CSS, Pinia, Vue Router
- **Dev Server:** `npm run dev:frontend`
- **Build:** `npm run build:frontend`

### Backend (Node.js/Express)
- **Location:** `./backend`
- **Tech Stack:** Express, TypeScript, MongoDB, Mongoose
- **Dev Server:** `npm run dev:backend`
- **Build:** `npm run build:backend`

## Environment Variables

### Backend (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/asset-generation-tool
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3000
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run start` - Start production backend server
- `npm run install:all` - Install dependencies for all projects