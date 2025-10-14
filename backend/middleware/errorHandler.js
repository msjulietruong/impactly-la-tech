/**
 * ========================================
 * ERROR HANDLER MIDDLEWARE
 * ========================================
 * 
 * This file handles ALL errors in the application.
 * Instead of having error handling code scattered everywhere,
 * we put it all in one place to make it easier to manage.
 * 
 * HOW IT WORKS:
 * 1. When something goes wrong anywhere in the app, it comes here
 * 2. We figure out what kind of error it is
 * 3. We send back a helpful error message to the user
 */

/**
 * Main error handler
 * This catches all errors and sends back user-friendly messages
 */
function errorHandler(error, req, res, next) {
  // Log the error so developers can see what went wrong
  console.error('❌ Error occurred:', error.message);
  
  // Figure out what HTTP status code to use (default is 500 = server error)
  const statusCode = error.statusCode || error.status || 500;
  
  // Figure out what error code to send (like 'NOT_FOUND', 'INVALID_ARGUMENT', etc.)
  const errorCode = error.code || 'INTERNAL_ERROR';
  
  // Create a helpful error message
  const message = error.message || 'Something went wrong on our server';
  
  // Send the error back to the user
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message
    }
  });
}

/**
 * 404 Not Found Handler
 * This runs when someone tries to visit a URL that doesn't exist
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot find ${req.method} ${req.originalUrl}`
    }
  });
}

/**
 * Helper function to create errors easily
 * 
 * USAGE EXAMPLES:
 *   throw createError(404, 'NOT_FOUND', 'Product not found')
 *   throw createError(400, 'INVALID_ARGUMENT', 'Please provide a product ID')
 */
function createError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

// Export so other files can use these
export { errorHandler, notFoundHandler, createError };

