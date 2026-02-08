import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import routes from "./routes/routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getEmbedder } from "./controllers/embeddingController.js";
import { PORT, MONGODB_URI } from "./utils/config.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
app.use("/", routes);
app.use("*", notFoundHandler);
app.use(errorHandler);
// ============================================================================
// STEP 5: Connect to MongoDB Database
// ============================================================================
/**
 * This function connects to our MongoDB database
 * MongoDB is where we store company information and ESG scores
 */
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB connected successfully");
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("MongoDB connection error:", error.message);
        }
        else {
            console.error("MongoDB connection error:", error);
        }
        process.exit(1);
    }
}
// ============================================================================
// STEP 6: Start the Server
// ============================================================================
/**
 * This function starts our server
 * It first connects to the database, then starts listening for requests
 */
async function startServer() {
    await connectDB();
    await getEmbedder();
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 Visit: http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
}
function gracefulShutdown() {
    console.log("Shutting down...");
    mongoose.connection.close();
    process.exit(0);
}
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
if (process.argv[1] === __filename) {
    startServer().catch((error) => {
        if (error instanceof Error) {
            console.error("Failed to start server:", error.message);
        }
        else {
            console.error("Failed to start server:", error);
        }
        process.exit(1);
    });
}
export default app;
