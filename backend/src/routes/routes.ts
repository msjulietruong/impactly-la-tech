import express from "express";
import type { Router } from "express";

import * as healthController from "../controllers/healthController.js";
import * as productController from "../controllers/productController.js";
import * as companyController from "../controllers/companyController.js";
import embeddingsRoutes from "./embeddings.js";

import validateObjectId from "../middleware/validateObjectId.js";

// Create the router (this will hold all our routes)
const router: Router = express.Router();

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================
// These check if the server is running and healthy

/**
 * Health check endpoint
 *
 * What it does: Tells you if the server is alive and working
 *
 * Available at TWO URLs for convenience:
 *   - /health        (short and simple)
 *   - /api/health    (follows API naming pattern)
 */
router.get("/health", healthController.getHealth);
router.get("/api/health", healthController.getHealth);

// ============================================================================
// PRODUCT ENDPOINTS - The Main API!
// ============================================================================
// These endpoints let you search and get information about products

/**
 * ENDPOINT 1: Product search and listing
 *
 * What it does: Finds products by name or barcode
 *
 * How to use:
 *   GET /api/products?q=chocolate        → Search for "chocolate"
 *   GET /api/products?upc=123456789012   → Find exact product by barcode
 */
router.get("/api/products", productController.getAllProducts);

/**
 * ENDPOINT 2: Product details by ID
 *
 * What it does: Shows ALL information about one specific product
 *
 * How to use:
 *   GET /api/products/3274080005003   → Get details for product 3274080005003
 */
router.get("/api/products/:id", productController.getProductById);

/**
 * Product lookup by barcode (alternative route)
 *
 * What it does: Same as above, but different URL format
 *
 * How to use:
 *   GET /api/products/barcode/3274080005003
 */
router.get("/api/products/barcode/:code", productController.getProductByCode);

// THIS ROUTE DOES NOT EXIST ANYMORE; ESG IS CALCULATED WHEN QUERYING PRODUCT.
// router.get("/api/products/:id/esg", productController.getProductESG);

/**
 * Product alternatives (Future feature - vector search)
 *
 * What it will do: Find similar products that are more ethical
 * Status: Coming soon!
 *
 * How to use:
 *   GET /api/products/:id/alternatives?limit=5
 */
router.get(
  "/api/products/:id/alternatives",
  productController.getProductAlternatives,
);

/**
 * Product summaries (Future feature - AI powered)
 *
 * What it will do: Generate smart summaries using AI
 * Status: Coming soon!
 *
 * How to use:
 *   GET /api/products/:id/summary    → Get existing or generate new summary
 */
router.get("/api/products/:id/summary", productController.getProductSummary);

// ============================================================================
// COMPANY ENDPOINTS
// ============================================================================
// These endpoints give you information about companies directly

/**
 * Company details by ID
 *
 * What it does: Gets all info about a company using its database ID
 *
 * How to use:
 *   GET /api/companies/507f1f77bcf86cd799439011
 *
 * Note: validateObjectId checks that the ID is valid before running
 */
router.get(
  "/api/companies/:id",
  validateObjectId("id"),
  companyController.getCompanyById,
);

// ============================================================================
// LEGACY ENDPOINTS (v1)
// ============================================================================
// These are old endpoints from version 1 of the API
// They still work for backwards compatibility (so old apps don't break)
// If you're building something new, use /api/* endpoints instead!

/**
 * Legacy product lookup
 *
 * Same as /api/products but older URL format
 *
 * How to use:
 *   GET /v1/lookup?upc=123456789012   → Find by barcode
 *   GET /v1/lookup?q=chocolate        → Search by text
 */
router.get("/v1/lookup", productController.getAllProducts);

/**
 * Legacy company lookup
 *
 * Find companies by ticker symbol, name, or ID
 *
 * How to use:
 *   GET /v1/company?ticker=MSFT       → Find Microsoft by ticker
 *   GET /v1/company?q=microsoft       → Search for "microsoft"
 *   GET /v1/company/:id               → Get by database ID
 */
router.get("/v1/company", companyController.getCompany);
router.get(
  "/v1/company/:id",
  validateObjectId("id"),
  companyController.getCompany,
);

/**
 * Legacy ESG score endpoint
 *
 * Gets the ESG score for a company
 *
 * How to use:
 *   GET /v1/score/507f1f77bcf86cd799439011
 *
 * What you get:
 *   - Overall score (0-100)
 *   - Breakdown: E, S, G scores
 *   - Methodology: How we calculated it
 *   - Confidence: How sure we are
 */
router.get(
  "/v1/score/:companyId",
  validateObjectId("companyId"),
  companyController.getCompanyScore,
);
router.use("/api/food", embeddingsRoutes);

export default router;
