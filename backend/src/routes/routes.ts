import express from "express";
import type { Router } from "express";

import * as healthController from "../controllers/healthController.js";
import * as productController from "../controllers/productController.js";
import * as companyController from "../controllers/companyController.js";
import * as embeddingsController from "../controllers/embeddingController.js";

import validateObjectId from "../middleware/validateObjectId.js";

const router: Router = express.Router();

router.get("/health", healthController.getHealth);
router.get("/api/health", healthController.getHealth);

// Search products by name
router.get("/search/:query", productController.searchProducts);
router.get("/api/search/:query", productController.searchProducts);

/*
 * How to use:
 *   GET /api/products?q=chocolate        → Search for "chocolate"
 *   GET /api/products?upc=123456789012   → Find exact product by barcode
 */
router.get("/api/products", productController.getProducts);

router.get("/api/products/:code", productController.getProductByCode);
router.get("/api/products/code/:code", productController.getProductByCode);
router.get("/api/products/barcode/:code", productController.getProductByCode);

router.get("/api/products/id/:id", productController.getProductById);

router.get(
    "/api/products/:code/alternatives",
    productController.getProductAlternatives,
);
router.get(
    "/api/products/code/:code/alternatives",
    productController.getProductAlternatives,
);
router.get(
    "/api/products/barcode/:code/alternatives",
    productController.getProductAlternatives,
);

router.get("/api/products/:code/summary", productController.getProductSummary);

router.get(
    "/api/companies/:id",
    validateObjectId("id"),
    companyController.getCompanyById,
);

// Generate embeddings (run once)
router.post("/api/generate", embeddingsController.generateEmbeddings);

router.get("/debug/grades", embeddingsController.debugGradeStats);
router.get("/api/debug/grades", embeddingsController.debugGradeStats);

export default router;
