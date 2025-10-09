import mongoose from 'mongoose';

// Validate MongoDB ObjectId format in URL parameters
export default function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];

    // Skip validation if no ID provided
    if (!id) {
      return next();
    }

    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: `Invalid ${paramName} format. Expected a valid MongoDB ObjectId.`
      });
    }

    // Continue to next middleware
    next();
  };
}
