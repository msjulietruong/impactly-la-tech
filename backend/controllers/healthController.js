/**
 * ========================================
 * HEALTH CONTROLLER
 * ========================================
 * 
 * This simple controller checks if the server is running and healthy.
 * It's like asking "Hey server, are you awake and working?"
 * 
 * The frontend can call this to make sure the backend is online.
 */

/**
 * FUNCTION: Get server health status
 * 
 * What this does:
 * - Tells you if the server is running (status: "healthy")
 * - Shows you the current time
 * - Shows you how long the server has been running (uptime)
 * - Shows you which environment we're in (development/production)
 * 
 * How to use it:
 *   GET /api/health OR GET /health
 * 
 * What you get back:
 *   {
 *     "status": "healthy",
 *     "timestamp": "2025-10-14T10:30:00.000Z",
 *     "uptime": 3600,
 *     "environment": "development"
 *   }
 */
export const getHealth = (req, res) => {
  res.json({
    status: 'healthy',                            // Server is up and running!
    timestamp: new Date().toISOString(),          // Current time (ISO format)
    uptime: process.uptime(),                     // Seconds since server started
    environment: process.env.NODE_ENV || 'development'  // dev or production?
  });
};
