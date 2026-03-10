function errorHandler(error, req, res, next) {
    console.error("❌ Error occurred:", error.message);
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || "INTERNAL_ERROR";
    const message = error.message || "Something went wrong on our server";
    return res.status(statusCode).json({
        error: {
            code: errorCode,
            message: message,
        },
    });
}
/**
 * 404 Not Found Handler
 * This runs when someone tries to visit a URL that doesn't exist
 */
function notFoundHandler(req, res) {
    return res.status(404).json({
        error: {
            code: "NOT_FOUND",
            message: `Cannot find ${req.method} ${req.originalUrl}`,
        },
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
