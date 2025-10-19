/**
 * ========================================
 * SERVER
 * ========================================
 * 
 * It does these main things:
 * 1. Connects to our MongoDB database (where we store company & ESG data)
 * 2. Sets up our API routes (URLs that the frontend can call)
 * 3. Starts the server so it can receive requests
 */

import dotenv from "dotenv";
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initializeEmbedder } from './controllers/embeddingsController.js';

// ============================================================================
// STEP 1: Load Environment Variables
// ============================================================================
// Environment variables are secret settings stored in the .env file
// (like database passwords, API keys, etc.)
if (!process.env.CI) {
    dotenv.config();
}

// ============================================================================
// STEP 2: Create the Express App
// ============================================================================
// Express is a tool that helps us build web servers easily
const app = express();

// What port (door number) should the server listen on?
// We check these in order: PORT from .env → WEBSITES_PORT → default to 3001
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 3001;

// ============================================================================
// STEP 3: Set Up Middleware (Helpers)
// ============================================================================
// Middleware = code that runs BEFORE our routes handle requests
// Think of it like security checks before entering a building

// CORS = Allows our frontend (on a different port) to talk to this backend
app.use(cors());

// These two lines let us receive JSON data and form data from requests
app.use(express.json());                      // For JSON data
app.use(express.urlencoded({ extended: true }));  // For form data

// Log every request (helpful for debugging)
// This prints: "2025-10-14 10:30:00 - GET /api/products"
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();  // Move on to the next middleware or route
});

// ============================================================================
// STEP 4: Set Up Routes (URL Endpoints)
// ============================================================================
// Routes define what happens when someone visits different URLs
// Example: GET /api/products → calls the product controller
app.use('/', routes);

// ============================================================================
// STEP 5: Set Up Error Handling
// ============================================================================
// If someone visits a URL that doesn't exist, send a helpful 404 error
app.use('*', notFoundHandler);

// If anything goes wrong in our code, this catches it and sends a nice error
app.use(errorHandler);

// ============================================================================
// STEP 6: Connect to MongoDB Database
// ============================================================================
/**
 * This function connects to our MongoDB database
 * MongoDB is where we store company information and ESG scores
 */
async function connectDB() {
    try {
        // Get the database connection URL from environment variables
        // If not set, use a local database as fallback
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ethical-product-finder';
        
        // Try to connect!
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        // If connection fails, print error and stop the app
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);  // Exit code 1 = something went wrong
    }
}

// ============================================================================
// STEP 7: Start the Server
// ============================================================================
/**
 * This function starts our server
 * It first connects to the database, then starts listening for requests
 */
async function startServer() {
    // First, connect to the database
    await connectDB();

    // initializes embedding model
    await initializeEmbedder();
    
    // Then start the server on the specified port
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 Visit: http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// ============================================================================
// STEP 8: Handle Graceful Shutdown
// ============================================================================
// These functions make sure we close the database connection properly
// when the server stops (instead of just cutting it off)

// SIGTERM = signal sent when deploying new code
process.on('SIGTERM', () => {
    console.log('⏹️  Shutting down gracefully...');
    mongoose.connection.close(() => {
        process.exit(0);  // Exit code 0 = everything is OK
    });
});

// SIGINT = signal sent when you press Ctrl+C
process.on('SIGINT', () => {
    console.log('⏹️  Shutting down gracefully...');
    mongoose.connection.close(() => {
        process.exit(0);
    });
});

// ============================================================================
// STEP 9: Start the Server (Only if this file is run directly)
// ============================================================================
// This checks if we're running this file directly (not importing it for tests)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
    startServer().catch((error) => {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    });
}

// Export the app so tests can use it
export default app;
