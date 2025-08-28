const express = require('express')
const fs = require('fs').promises
const path = require('path')
const cors = require('cors')

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Storage paths
const STORAGE_DIR = path.join(__dirname, 'storage')
const PROJECTS_FILE = path.join(STORAGE_DIR, 'projects.json')
const ASSETS_FILE = path.join(STORAGE_DIR, 'assets.json')

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating storage directory:', error)
  }
}

// Helper function to read JSON file
async function readJSONFile(filePath, defaultValue = []) {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist, return default value
    return defaultValue
  }
}

// Helper function to write JSON file
async function writeJSONFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Error writing file:', error)
    return false
  }
}

// Routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await readJSONFile(PROJECTS_FILE)
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to load projects' })
  }
})

app.post('/api/projects', async (req, res) => {
  try {
    const projects = await readJSONFile(PROJECTS_FILE)
    const success = await writeJSONFile(PROJECTS_FILE, req.body)
    if (success) {
      res.json({ success: true })
    } else {
      res.status(500).json({ error: 'Failed to save projects' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save projects' })
  }
})

app.get('/api/assets', async (req, res) => {
  try {
    const assets = await readJSONFile(ASSETS_FILE)
    res.json(assets)
  } catch (error) {
    res.status(500).json({ error: 'Failed to load assets' })
  }
})

app.post('/api/assets', async (req, res) => {
  try {
    const success = await writeJSONFile(ASSETS_FILE, req.body)
    if (success) {
      res.json({ success: true })
    } else {
      res.status(500).json({ error: 'Failed to save assets' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save assets' })
  }
})

// Initialize and start server
async function startServer() {
  await ensureStorageDir()
  
  // Initialize with sample data if files don't exist
  const projects = await readJSONFile(PROJECTS_FILE)
  if (projects.length === 0) {
    const sampleProjects = [
      {
        "id": "sample-project-1",
        "name": "Car Dealership Website",
        "description": "A modern, professional website for a luxury car dealership featuring high-end vehicles and premium service offerings.",
        "category": "website",
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
    await writeJSONFile(PROJECTS_FILE, sampleProjects)
  }
  
  const assets = await readJSONFile(ASSETS_FILE)
  if (assets.length === 0) {
    const sampleAssets = [
      {
        "id": "sample-asset-1",
        "projectId": "sample-project-1",
        "name": "Hero Banner Image",
        "type": "image",
        "context": "Main banner image for the homepage showcasing luxury cars in an elegant showroom setting",
        "prompt": "Create a professional, high-end automotive showroom image featuring luxury cars in a modern, well-lit dealership.",
        "status": "completed",
        "createdAt": "2025-01-15T11:00:00.000Z"
      }
    ]
    await writeJSONFile(ASSETS_FILE, sampleAssets)
  }
  
  app.listen(PORT, () => {
    console.log(`Storage server running on http://localhost:${PORT}`)
    console.log(`Storage directory: ${STORAGE_DIR}`)
  })
}

startServer()