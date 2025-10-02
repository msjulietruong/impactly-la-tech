const express = require('express');
const router = express.Router();

// Import controllers
const healthController = require('../controllers/healthController');
const lookupController = require('../controllers/lookupController');
const companyController = require('../controllers/companyController');
const scoreController = require('../controllers/scoreController');

// Import middleware
const validateObjectId = require('../middleware/validateObjectId');

// Health check route
router.get('/health', healthController.getHealth);

// API v1 routes
router.get('/v1/lookup', lookupController.lookupProduct);
router.get('/v1/company', companyController.getCompany); // Support ticker and q query params
router.get('/v1/company/:id', validateObjectId('id'), companyController.getCompany); // Support MongoDB _id
router.get('/v1/score/:companyId', validateObjectId('companyId'), scoreController.getScore);

module.exports = router;
