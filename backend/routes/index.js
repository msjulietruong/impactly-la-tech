import express from 'express';

// Import controllers
import * as healthController from '../controllers/healthController.js';
import * as lookupController from '../controllers/lookupController.js';
import * as companyController from '../controllers/companyController.js';
import * as scoreController from '../controllers/scoreController.js';

// Import middleware
import validateObjectId from '../middleware/validateObjectId.js';

const router = express.Router();

// Health check endpoints
router.get('/health', healthController.getHealth);
router.get('/api/health', healthController.getHealth);

// Product lookup endpoints
router.get('/v1/lookup', lookupController.lookupProduct);
router.get('/api/products', lookupController.lookupProduct);
router.get('/api/products/barcode/:code', lookupController.lookupProduct);

// Company lookup endpoints
router.get('/v1/company', companyController.getCompany);
router.get('/v1/company/:id', validateObjectId('id'), companyController.getCompany);

// ESG score endpoint
router.get('/v1/score/:companyId', validateObjectId('companyId'), scoreController.getScore);

export default router;
