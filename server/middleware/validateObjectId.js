const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectId format
 * Returns 400 if the ID is invalid instead of 500
 */
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return next(); // Let the controller handle missing ID
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ARGUMENT',
          message: `Invalid ${paramName} format. Expected a valid MongoDB ObjectId.`
        }
      });
    }
    
    next();
  };
}

module.exports = validateObjectId;

