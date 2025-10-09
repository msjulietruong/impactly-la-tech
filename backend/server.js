import dotenv from "dotenv";
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import routes from './routes/index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
if (!process.env.CI) {
    dotenv.config();
}

const app = express();
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 3000;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/', routes);

// 404 handler for unknown routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.originalUrl} not found`
        }
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Error:', error.message);
    
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    
    res.status(status).json({ 
        error: {
            code: 'INTERNAL_ERROR',
            message: message
        }
    });
});

// Connect to MongoDB
async function connectDB() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ethical-product-finder';
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Start server
async function startServer() {
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    mongoose.connection.close(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    mongoose.connection.close(() => {
        process.exit(0);
    });
});

// Start the server if this file is run directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
    startServer().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

export default app;
