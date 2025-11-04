import { lookupProduct as lookupProductService } from "../services/openFoodFactsService.js";
import ProductCache from "../models/ProductCache.js";
import Company from "../models/Company.js";
import axios from "axios";
import redisClient from "../utils/redisClient.js";
import { CACHE_TTL } from "../utils/config.js";

/**
 * PRODUCT CONTROLLER
 *
 * This controller handles all product-related operations including:
 * - Searching and listing products
 * - Getting product details by ID or barcode
 * - Fetching ESG (Environmental, Social, Governance) data for products
 * - Managing product alternatives
 * - Generating and caching product summaries
 *
 * All functions follow a standard format:
 * 1. Extract parameters from request
 * 2. Validate input
 * 3. Process the request (database queries, external API calls, etc.)
 * 4. Return formatted response
 * 5. Handle errors appropriately
 */

// ============================================================================
// BRAND TO COMPANY MAPPING
// ============================================================================

const COMPANY_BRAND_MAP = {
  // Walmart brands
  walmart: "Walmart Inc",
  "great value": "Walmart Inc",
  "sam's choice": "Walmart Inc",
  marketside: "Walmart Inc",
  equate: "Walmart Inc",

  // Kroger brands
  kroger: "Kroger",
  "simple truth": "Kroger",
  "private selection": "Kroger",

  // Target brands
  target: "Target",
  "good & gather": "Target",
  "market pantry": "Target",

  // Costco brands
  costco: "Costco",
  "kirkland signature": "Costco",

  // General Mills brands
  "general mills": "General Mills",
  cheerios: "General Mills",
  "nature valley": "General Mills",
  yoplait: "General Mills",
  "lucky charms": "General Mills",
  pillsbury: "General Mills",
  "haagen-dazs": "General Mills",
  "betty crocker": "General Mills",
  "old el paso": "General Mills",
  totino: "General Mills",
  trix: "General Mills",
  "cocoa puffs": "General Mills",
  "cinnamon toast crunch": "General Mills",
  "fiber one": "General Mills",
  wheaties: "General Mills",

  // PepsiCo brands
  pepsi: "PepsiCo",
  pepsico: "PepsiCo",
  "frito-lay": "PepsiCo",
  "lay's": "PepsiCo",
  lays: "PepsiCo",
  doritos: "PepsiCo",
  "mountain dew": "PepsiCo",
  gatorade: "PepsiCo",
  tropicana: "PepsiCo",
  quaker: "PepsiCo",
  tostitos: "PepsiCo",
  cheetos: "PepsiCo",
  ruffles: "PepsiCo",

  // Coca-Cola brands
  "coca-cola": "Coca-Cola",
  coke: "Coca-Cola",
  sprite: "Coca-Cola",
  fanta: "Coca-Cola",
  dasani: "Coca-Cola",
  "minute maid": "Coca-Cola",
  powerade: "Coca-Cola",
  vitaminwater: "Coca-Cola",

  // Nestlé brands
  nestle: "Nestlé",
  nescafe: "Nestlé",
  "kit kat": "Nestlé",
  "pure life": "Nestlé",
  gerber: "Nestlé",
  stouffer: "Nestlé",
  digiorno: "Nestlé",
  "hot pockets": "Nestlé",
  "lean cuisine": "Nestlé",
  butterfinger: "Nestlé",
  crunch: "Nestlé",

  // Kellogg's brands
  kelloggs: "Kellogg's",
  "kellogg's": "Kellogg's",
  pringles: "Kellogg's",
  "cheez-it": "Kellogg's",
  "frosted flakes": "Kellogg's",
  "special k": "Kellogg's",
  "pop-tarts": "Kellogg's",
  "rice krispies": "Kellogg's",
  eggo: "Kellogg's",
  "nutri-grain": "Kellogg's",

  // Mars brands
  mars: "Mars",
  "m&m's": "Mars",
  "m&m": "Mars",
  snickers: "Mars",
  twix: "Mars",
  "milky way": "Mars",
  skittles: "Mars",
  starburst: "Mars",

  // Mondelez brands
  oreo: "Mondelez",
  cadbury: "Mondelez",
  ritz: "Mondelez",
  trident: "Mondelez",
  "chips ahoy": "Mondelez",
  "wheat thins": "Mondelez",
  triscuit: "Mondelez",

  // Kraft Heinz brands
  kraft: "Kraft Heinz",
  heinz: "Kraft Heinz",
  "oscar mayer": "Kraft Heinz",
  philadelphia: "Kraft Heinz",
  velveeta: "Kraft Heinz",
  "capri sun": "Kraft Heinz",
  "jell-o": "Kraft Heinz",
  "maxwell house": "Kraft Heinz",
  planters: "Kraft Heinz",
  lunchables: "Kraft Heinz",
  "kool-aid": "Kraft Heinz",

  // Campbell brands
  campbell: "Campbell",
  "campbell's": "Campbell",
  "pepperidge farm": "Campbell",
  goldfish: "Campbell",
  v8: "Campbell",
  prego: "Campbell",
  swanson: "Campbell",

  // McCormick brands
  mccormick: "McCormick",
  french: "McCormick",
  "french's": "McCormick",
  "old bay": "McCormick",
  lawry: "McCormick",
  "lawry's": "McCormick",
  casero: "McCormick",

  // Hershey brands
  hershey: "Hershey",
  "hershey's": "Hershey",
  reese: "Hershey",
  "reese's": "Hershey",
  kisses: "Hershey",
  "jolly rancher": "Hershey",
  "ice breakers": "Hershey",

  // ConAgra brands
  conagra: "ConAgra",
  hunt: "ConAgra",
  "hunt's": "ConAgra",
  "reddi-wip": "ConAgra",
  "slim jim": "ConAgra",
  "healthy choice": "ConAgra",
  "marie callender": "ConAgra",
  "marie callender's": "ConAgra",
  "orville redenbacher": "ConAgra",
  "swiss miss": "ConAgra",
  vlasic: "ConAgra",

  // Hormel brands
  hormel: "Hormel",
  spam: "Hormel",
  skippy: "Hormel",
  "jennie-o": "Hormel",
  applegate: "Hormel",

  // Tyson brands
  tyson: "Tyson",
  "jimmy dean": "Tyson",
  "hillshire farm": "Tyson",
  "ball park": "Tyson",
};

/**
 * Convert brand name to parent company name
 */
function getBrandCompanyName(brandName) {
  if (!brandName) return null;
  const normalized = brandName.toLowerCase().trim();
  return COMPANY_BRAND_MAP[normalized] || brandName;
}

// ============================================================================
// HELPER FUNCTION: Get ESG data for a product
// ============================================================================
/**
 * Helper function to get ESG data for a product by brand name
 * Returns null if no ESG data is found
 *
 */
async function getProductESGData(brandName) {
  if (!brandName) return null;

  try {
    // Map brand to parent company (e.g., "Great Value" → "Walmart Inc")
    const companyName = getBrandCompanyName(brandName);

    // Find the company in our database
    const company = await Company.findOne({
      name: { $regex: companyName, $options: "i" },
    });

    if (!company) {
      return null;
    }

    // ✅ NEW: Extract scores from flat structure
    const E = company.environment_score ?? null;
    const S = company.social_score ?? null;
    const G = company.governance_score ?? null;

    // Calculate overall score (use total_score if available, otherwise calculate)
    let overall = company.total_score ?? null;

    if (overall === null && (E !== null || S !== null || G !== null)) {
      const availableFactors = [E, S, G].filter((score) => score !== null);
      const weights = {
        wE:
          E !== null
            ? availableFactors.length === 3
              ? 0.4
              : 1.0 / availableFactors.length
            : 0,
        wS:
          S !== null
            ? availableFactors.length === 3
              ? 0.4
              : 1.0 / availableFactors.length
            : 0,
        wG:
          G !== null
            ? availableFactors.length === 3
              ? 0.2
              : 1.0 / availableFactors.length
            : 0,
      };
      overall = Math.round(
        (E || 0) * weights.wE + (S || 0) * weights.wS + (G || 0) * weights.wG
      );
    }

    return {
      environmental: E,
      social: S,
      governance: G,
      overall: overall,
    };
  } catch (error) {
    console.error("Error fetching ESG data:", error);
    return null;
  }
}

// ============================================================================
// PRODUCT SEARCH AND LISTING
// ============================================================================

const getAllProducts = async (req, res) => {
  try {
    const { upc, ean, gtin, q } = req.query;

    if (!upc && !ean && !gtin && !q) {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message:
            "Missing required parameters. Provide either upc, ean, gtin, or q for search",
        },
      });
    }

    let result;
    try {
      result = await lookupProductService({ upc, ean, gtin, q });
    } catch (error) {
      throw error;
    }

    const isArray = Array.isArray(result);
    const products = isArray ? result : [result];

    if (q && !isArray) {
      console.warn(
        "Text search returned non-array result, converting to array"
      );
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Invalid search result format",
        },
      });
    }

    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const esgData = await getProductESGData(product.brand);

        const esgFormatted = esgData
          ? {
              environmental: esgData.environmental,
              social: esgData.social,
              governance: esgData.governance,
              overall: esgData.overall,
            }
          : null;

        return {
          ...product,
          esg: esgFormatted,
        };
      })
    );

    if (isArray) {
      res.json(enrichedProducts);
    } else {
      res.json(enrichedProducts[0]);
    }
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      });
    }

    if (error.code === "INVALID_ARGUMENT") {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message: error.message,
        },
      });
    }

    console.error("Product search error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to search products",
      },
    });
  }
};

// ============================================================================
// PRODUCT DETAILS
// ============================================================================

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message: "Product ID is required",
        },
      });
    }

    const cached = await ProductCache.findOne({ code: id });
    if (cached) {
      return res.json(cached.data);
    }

    const product = await lookupProductService({ upc: id });
    res.json(product);
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Product not found with ID: ${req.params.id}`,
        },
      });
    }

    console.error("Product lookup error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get product details",
      },
    });
  }
};

const getProductByBarcode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message: "Barcode is required",
        },
      });
    }

    const product = await lookupProductService({ upc: code });
    res.json(product);
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Product not found with barcode: ${req.params.code}`,
        },
      });
    }

    console.error("Barcode lookup error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to lookup product by barcode",
      },
    });
  }
};

// ============================================================================
// HELPER FUNCTION: Get company ESG with collection
// ============================================================================
async function getCompanyESGWithCollection(brandName, esgCollection) {
  if (!brandName) return null;

  const companyName = getBrandCompanyName(brandName);
  const cleanName = companyName.split(",")[0].trim();

  let company = await esgCollection.findOne({
    name: { $regex: new RegExp(`^${cleanName}`, "i") },
  });

  if (!company) {
    company = await esgCollection.findOne({
      name: { $regex: cleanName, $options: "i" },
    });
  }

  if (!company) return null;

  return {
    company_name: company.name,
    ticker: company.ticker || null,
    environment_score: company.environment_score || null,
    environment_level: company.environment_level || null,
    social_score: company.social_score || null,
    social_level: company.social_level || null,
    governance_score: company.governance_score || null,
    governance_level: company.governance_level || null,
    total_score: company.total_score || null,
    total_level: company.total_level || null,
    last_processing_date: company.last_processing_date || null,
  };
}

// ============================================================================
// ESG DATA (Environmental, Social, Governance Scores)
// ============================================================================

const getProductESG = async (req, res) => {
  try {
    const { id } = req.params;

    const cached = await ProductCache.findOne({ code: id });
    let product;

    if (cached) {
      product = cached.data;
    } else {
      try {
        if (/^\d+$/.test(id)) {
          product = await lookupProductService({ upc: id });
        } else {
          product = await lookupProductService({ gtin: id });
        }

        if (Array.isArray(product)) {
          product = product[0];
        }
      } catch (error) {
        throw error;
      }
    }

    if (!product || !product.brand) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message:
            "Brand information not available for this product. ESG data cannot be retrieved.",
        },
      });
    }

    const companyName = getBrandCompanyName(product.brand);
    const company = await Company.findOne({
      name: { $regex: companyName, $options: "i" },
    });

    if (!company) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `No ESG data found for product brand: ${companyName}`,
        },
      });
    }

    const E = company.environment_score ?? null;
    const S = company.social_score ?? null;
    const G = company.governance_score ?? null;
    let overall = company.total_score ?? null;

    if (overall === null && (E !== null || S !== null || G !== null)) {
      const availableFactors = [E, S, G].filter((score) => score !== null);
      const weights = {
        wE:
          E !== null
            ? availableFactors.length === 3
              ? 0.4
              : 1.0 / availableFactors.length
            : 0,
        wS:
          S !== null
            ? availableFactors.length === 3
              ? 0.4
              : 1.0 / availableFactors.length
            : 0,
        wG:
          G !== null
            ? availableFactors.length === 3
              ? 0.2
              : 1.0 / availableFactors.length
            : 0,
      };
      overall = Math.round(
        (E || 0) * weights.wE + (S || 0) * weights.wS + (G || 0) * weights.wG
      );
    }

    res.json({
      productId: id,
      productName: product.name,
      brand: product.brand,
      companyId: company._id.toString(),
      companyName: company.name,
      esgData: {
        environment: {
          score: E,
          grade: company.environment_grade || null,
          level: company.environment_level || null,
          description:
            "Environmental impact score (0-100, higher is better for Earth)",
        },
        social: {
          score: S,
          grade: company.social_grade || null,
          level: company.social_level || null,
          description:
            "Social responsibility score (0-100, higher means treats people better)",
        },
        governance: {
          score: G,
          grade: company.governance_grade || null,
          level: company.governance_level || null,
          description:
            "Corporate governance score (0-100, higher means more trustworthy)",
        },
        overall: {
          score: overall,
          grade: company.total_grade || null,
          level: company.total_level || null,
          description: "Overall ESG score (weighted average of E, S, G)",
        },
        scale: "0-100",
      },
      lastProcessingDate: company.last_processing_date,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      });
    }

    console.error("ESG lookup error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get ESG data for product",
      },
    });
  }
};

// ============================================================================
// PRODUCT ALTERNATIVES (VECTOR SEARCH)
// ============================================================================

const getProductAlternatives = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const mongoose = (await import("mongoose")).default;
    const foodCollection = mongoose.connection.db.collection("food");
    const esgCollection = mongoose.connection.db.collection("esg_scores");

    let product = null;
    const numericId = /^\d+$/.test(id) ? parseInt(id) : null;

    if (numericId !== null) {
      product = await foodCollection.findOne({ code: numericId });
    }

    if (!product) {
      try {
        const lookupResult = await lookupProductService(
          numericId !== null ? { upc: id } : { gtin: id }
        );

        if (lookupResult && !Array.isArray(lookupResult)) {
          const productCode = lookupResult.id || lookupResult.barcode?.value;
          if (productCode && /^\d+$/.test(productCode.toString())) {
            product = await foodCollection.findOne({
              code: parseInt(productCode),
            });
          }

          if (!product && lookupResult.name) {
            product = await foodCollection.findOne({
              product_name: { $regex: lookupResult.name, $options: "i" },
            });
          }
        } else if (Array.isArray(lookupResult) && lookupResult.length > 0) {
          const firstResult = lookupResult[0];
          const productCode = firstResult.id || firstResult.barcode?.value;
          if (productCode && /^\d+$/.test(productCode.toString())) {
            product = await foodCollection.findOne({
              code: parseInt(productCode),
            });
          }
        }
      } catch (error) {
        console.log(
          `Product ${id} not found via lookup service:`,
          error.message
        );
      }
    }

    if (!product) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Product not found with ID: ${id}. Product may not be in the food database.`,
        },
      });
    }

    if (!product.embedding || product.embedding.length === 0) {
      return res.json({
        productId: id,
        productName: product.product_name,
        alternatives: [],
        message:
          "Product does not have embeddings yet. Generate embeddings by running: POST /api/food/generate",
      });
    }

    const GRADE_SCORES = { a: 5, b: 4, c: 3, d: 2, e: 1, unknown: 0, "": 0 };
    const originalGrade = String(
      product.environmental_score_grade || ""
    ).toLowerCase();
    const originalScore = GRADE_SCORES[originalGrade] || 0;
    const isUnknownGrade = originalScore === 0;

    const categories = product.categories
      ? product.categories.split(",").map((c) => c.trim())
      : [];
    const specificCategory =
      categories.length > 0 ? categories[categories.length - 1] : "";
    const broadCategory =
      categories.length > 1 ? categories[categories.length - 2] : "";

    const query = {
      _id: { $ne: product._id },
      embedding: { $exists: true, $ne: [] },
    };

    if (!isUnknownGrade && specificCategory) {
      query.$or = [{ categories: { $regex: specificCategory, $options: "i" } }];
      if (broadCategory) {
        query.$or.push({
          categories: { $regex: broadCategory, $options: "i" },
        });
      }
    }

    const candidates = await foodCollection.find(query).toArray();

    function cosineSimilarity(vecA, vecB) {
      const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
      const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
      const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    }

    const similarityThreshold = isUnknownGrade ? 0.65 : 0.75;
    const alternatives = [];

    for (const candidate of candidates) {
      const similarity = cosineSimilarity(
        product.embedding,
        candidate.embedding
      );

      if (similarity > similarityThreshold) {
        const candidateGrade = String(
          candidate.environmental_score_grade || ""
        ).toLowerCase();
        const candidateScore = GRADE_SCORES[candidateGrade] || 0;

        if (candidateScore === 0) continue;

        const shouldInclude = isUnknownGrade
          ? true
          : candidateScore > originalScore;

        if (shouldInclude) {
          alternatives.push({
            code: candidate.code,
            product_name: candidate.product_name,
            brands: candidate.brands,
            categories: candidate.categories,
            environmental_score_grade: candidate.environmental_score_grade,
            image_url: candidate.image_url,
            similarity: Math.round(similarity * 100) / 100,
            grade_improvement: isUnknownGrade
              ? candidateScore
              : candidateScore - originalScore,
          });
        }
      }
    }

    alternatives.sort((a, b) => {
      if (Math.abs(b.similarity - a.similarity) > 0.05) {
        return b.similarity - a.similarity;
      }
      return b.grade_improvement - a.grade_improvement;
    });

    const enrichedAlternatives = await Promise.all(
      alternatives.slice(0, limit).map(async (alt) => {
        const companyESG = await getCompanyESGWithCollection(
          alt.brands,
          esgCollection
        );
        return {
          ...alt,
          company_esg: companyESG,
        };
      })
    );

    const originalProductESG = await getCompanyESGWithCollection(
      product.brands,
      esgCollection
    );

    res.json({
      productId: id,
      productName: product.product_name,
      brand: product.brands,
      environmental_score_grade: product.environmental_score_grade,
      company_esg: originalProductESG,
      alternatives: enrichedAlternatives,
      count: enrichedAlternatives.length,
      matchedCategory: isUnknownGrade
        ? "all categories"
        : specificCategory || broadCategory || "all categories",
      isUnknownGrade: isUnknownGrade,
      similarityThreshold: similarityThreshold,
      message: isUnknownGrade
        ? "Showing graded alternatives from all categories (original product has no environmental data)"
        : undefined,
      implementation: {
        status: "active",
        method:
          "Vector search using HuggingFace embeddings with ESG enrichment",
        features: [
          "Semantic similarity using AI embeddings (384-d vectors)",
          isUnknownGrade
            ? "Minimum 65% similarity for unknown products"
            : "Minimum 75% similarity threshold for relevance",
          "Filtered by better environmental grades",
          "Never recommends unknown grade products",
          isUnknownGrade
            ? "Searches all categories for unknown products"
            : "Specific category matching for graded products",
          "Sorted by similarity and grade improvement",
          "Enriched with company ESG scores with brand-to-company mapping",
        ],
      },
    });
  } catch (error) {
    console.error("Alternatives lookup error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get product alternatives",
      },
    });
  }
};

// ============================================================================
// PRODUCT SUMMARIES (AI-GENERATED)
// ============================================================================

const generateProductSummary = async (id) => {
  try {
    const cached = await ProductCache.findOne({ code: id });
    let product;

    if (cached) {
      product = cached.data;
    } else {
      try {
        product = await lookupProductService({ upc: id });
      } catch (lookupErr) {
        // Don't fail the entire summary generation if product lookup fails.
        // Log the error and continue; the agent can still run using product_identifier only.
        console.error(
          "Product lookup failed inside generateProductSummary:",
          lookupErr
        );
        product = null;
      }
    }

    const agentBase = process.env.AGENT_API_ENDPOINT || "http://localhost:8000";
    const agentUrl = `${agentBase.replace(/\/$/, "")}/workflow/run`;

    const headers = {};
    // If an internal agent API key is configured, send it as x-internal-key
    if (process.env.AGENT_API_KEY) {
      headers["x-internal-key"] = process.env.AGENT_API_KEY;
    }

    const payload = {
      product_identifier: String(id),
    };

    console.info(
      "Calling summary agent:",
      agentUrl,
      "payload keys:",
      Object.keys(payload)
    );
    const resp = await axios.post(agentUrl, payload, {
      headers,
      timeout: 100000,
    });

    if (!resp || !resp.data) {
      throw new Error("Empty response from agent");
    }

    // Normalize agent response to a consistent summary object
    const agentData = resp.data;
    const finalReport = agentData.final_report || {};

    const normalized = {
      productId: finalReport.product_id || String(id),
      productName:
        finalReport.product_name ||
        (product && (product.name || product.product_name)) ||
        "",
      brand:
        finalReport.brand ||
        (product && (product.brands || product.brand)) ||
        "",
      summary: finalReport.summary || [],
      metadata: finalReport.metadata || {},
      generatedAt: new Date().toISOString(),
    };

    // Compute per-company cache key (use normalized.brand first)
    const companyRaw =
      normalized.brand ||
      (product && (product.brands || product.brand)) ||
      String(id);
    const companyKey =
      encodeURIComponent(
        String(companyRaw)
          .split(",")[0]
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
      ) || String(id);
    const cacheKey = `brandSummary:${companyKey}`;

    // Cache the normalized summary in Redis under per-company key
    console.log(`[redis] caching with key: '${cacheKey}'`);

    await redisClient.set(cacheKey, JSON.stringify(normalized), {
      EX: CACHE_TTL,
    });

    return normalized;
  } catch (error) {
    const details = error?.response?.data ?? error.message ?? String(error);
    console.error("Summary generation error:", details);
    throw new Error(
      `Failed to generate product summary: ${
        typeof details === "string" ? details : JSON.stringify(details)
      }`
    );
  }
};

const getProductSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const cached = await ProductCache.findOne({ code: id });
    let product = null;

    if (cached) {
      product = cached.data;
    } else {
      try {
        product = await lookupProductService({ upc: id });
      } catch (lookupErr) {
        console.error(lookupErr);
      }
    }

    const companyRaw =
      (product && (product.brands || product.brand)) || String(id);
    const companyKey =
      encodeURIComponent(
        String(companyRaw)
          .split(",")[0]
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
      ) || String(id);
    const cacheKey = `brandSummary:${companyKey}`;

    console.log(`[redis] checking cache with key: '${cacheKey}'`);

    const redisCached = await redisClient.get(cacheKey);

    if (redisCached) {
      console.log("[redis] Cache hit:", JSON.parse(redisCached));

      return res.json(JSON.parse(redisCached));
    } else {
      console.log("[redis] Cache miss!");

      // NOTE(liam): generates new summary.
      try {
        const newSummary = await generateProductSummary(id);
        return res.json(newSummary);
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          error: {
            code: "INTERNAL_ERROR",
            message: err.message,
          },
        });
      }
    }
  } catch (error) {
    console.error("Summary retrieval error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve product summary",
      },
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  getProductESG,
  getProductAlternatives,
  getProductSummary,
};
