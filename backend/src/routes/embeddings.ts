import express from "express";
import type { Router } from "express";

import {
  generateEmbeddings,
  getBetterAlternatives,
  getProductById,
  searchProducts,
  debugGradeStats,
  searchCompanyESG,
} from "./controllers/embeddingsController.js";

const router = express.Router();

// Generate embeddings (run once)
router.post("/generate", generateEmbeddings);

// Get better alternatives for a product
router.get("/:productId/better-alternatives", getBetterAlternatives);

// Get product by ID
router.get("/:productId", getProductById);

// Search products by name
router.get("/search/:query", searchProducts);

router.get("/debug/grades", debugGradeStats);

router.get("/debug/esg-search", searchCompanyESG);

export default router;
