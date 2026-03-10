import express from "express";
import * as embeddingsController from "../controllers/embeddingController.js";
import * as productController from "../controllers/productController.js";
const router = express.Router();
// Generate embeddings (run once)
router.post("/generate", embeddingsController.generateEmbeddings);
// Get better alternatives for a product
router.get("/:productId/better-alternatives", productController.getProductAlternatives);
// Get product by ID
router.get("/:productId", productController.getProductById);
// Search products by name
router.get("/search/:query", embeddingsController.searchProducts);
router.get("/debug/grades", embeddingsController.debugGradeStats);
// router.get("/debug/esg-search", productController.searchCompanyESG);
export default router;
