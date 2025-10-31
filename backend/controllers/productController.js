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
  walmart: "Walmart",
  "great value": "Walmart",
  "sam's choice": "Walmart",
  marketside: "Walmart",
  equate: "Walmart",

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

  // ADD THESE MISSING ONES:

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
  return COMPANY_BRAND_MAP[normalized] || brandName; // Return original if no mapping
}

// ============================================================================
// PRODUCT SEARCH AND LISTING
// ============================================================================

/**
 * FUNCTION: Search for products or list products
 *
 * What this does:
 * - Lets users search for products by typing words (like "chocolate")
 * - OR lets users scan a barcode to find a specific product
 *
 * How to use it:
 *   GET /api/products?q=chocolate        (search for products with "chocolate")
 *   GET /api/products?upc=3274080005003  (find product with this barcode)
 *
 * What you get back:
 *   - Product information (name, brand, image, etc.)
 *   - If we can't find it, you get an error message
 */
const getAllProducts = async (req, res) => {
  try {
    // STEP 1: Get the search information from the URL
    // Example: if URL is "/api/products?q=chocolate", then q = "chocolate"
    const { upc, ean, gtin, q } = req.query;

    // STEP 2: Make sure the user provided at least one way to search
    // They need to give us either a barcode (upc/ean/gtin) OR a search word (q)
    if (!upc && !ean && !gtin && !q) {
      // Send back an error saying "you forgot to tell us what to search for!"
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message:
            "Missing required parameters. Provide either upc, ean, gtin, or q for search",
        },
      });
    }

    // STEP 3: Look up the product using our OpenFoodFacts service
    // This service talks to a big database of food products
    const product = await lookupProductService({
      upc, // Barcode number (if provided)
      ean, // Another type of barcode (if provided)
      gtin, // Yet another type of barcode (if provided)
      q, // Search words (if provided)
    });

    // STEP 4: Send the product information back to whoever asked for it
    res.json(product);
  } catch (error) {
    // STEP 5: Handle errors - things that went wrong

    // Error type 1: Product not found
    if (error.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      });
    }

    // Error type 2: Bad request (user sent wrong information)
    if (error.code === "INVALID_ARGUMENT") {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message: error.message,
        },
      });
    }

    // Error type 3: Something unexpected went wrong on our server
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

/**
 * FUNCTION: Get detailed information about ONE specific product
 *
 * What this does:
 * - Shows all the details about a single product
 * - Uses the product's ID (usually a barcode number)
 * - First checks our cache (saved data) for faster response
 * - If not in cache, fetches fresh data from the product database
 *
 * How to use it:
 *   GET /api/products/3274080005003
 *   (The number at the end is the product ID)
 *
 * What you get back:
 *   - Product name, brand, category, image
 *   - Ingredients and nutrition info
 *   - Company information
 */
const getProductById = async (req, res) => {
  try {
    // STEP 1: Get the product ID from the URL
    // Example: in "/api/products/3274080005003", the id is "3274080005003"
    const { id } = req.params;

    // STEP 2: Make sure they actually gave us an ID
    if (!id) {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message: "Product ID is required",
        },
      });
    }

    // STEP 3: Check our cache first (cache = saved data for faster loading)
    // This is like checking your notebook before looking in a big textbook
    const cached = await ProductCache.findOne({ code: id });
    if (cached) {
      // Found it in cache! Send it back immediately (faster!)
      return res.json(cached.data);
    }

    // STEP 4: Not in cache, so get fresh data from OpenFoodFacts
    // This takes a bit longer but ensures we have the latest info
    const product = await lookupProductService({ upc: id });

    // STEP 5: Send the product details back
    res.json(product);
  } catch (error) {
    // Handle errors

    // Error: Product doesn't exist
    if (error.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Product not found with ID: ${req.params.id}`,
        },
      });
    }

    // Error: Something went wrong on our end
    console.error("Product lookup error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get product details",
      },
    });
  }
};

/**
 * Get product by barcode
 *
 * Route: GET /api/products/barcode/:code
 * URL params: code (barcode value)
 *
 * Example:
 *   GET /api/products/barcode/3274080005003
 */
const getProductByBarcode = async (req, res) => {
  try {
    const { code } = req.params;

    // Validate barcode parameter
    if (!code) {
      return res.status(400).json({
        error: {
          code: "INVALID_ARGUMENT",
          message: "Barcode is required",
        },
      });
    }

    // Get product data using barcode
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
// Internal Helper Function for Get Product Alternatives
// ============================================================================

/**
 * Get company ESG data by brand name
 * @param {string} brandName - The brand name from the product
 * @param {object} esgCollection - MongoDB collection reference
 * @returns {object|null} Company ESG data or null if not found
 */
// Helper function to get company ESG data
async function getCompanyESG(brandName) {
  if (!brandName) return null;

  // ✅ ADD THIS LINE - Map brand to parent company first
  const companyName = getBrandCompanyName(brandName);

  // Clean up company name (remove extra spaces, commas, etc.)
  const cleanName = companyName.split(",")[0].trim();

  // Try exact match first
  let company = await esgCollection.findOne({
    name: { $regex: new RegExp(`^${cleanName}`, "i") }, // Changed from ^${cleanName}$ to be more flexible
  });

  // If not found, try partial match
  if (!company) {
    company = await esgCollection.findOne({
      name: { $regex: cleanName, $options: "i" },
    });
  }

  if (!company) return null;

  return {
    company_name: company.name,
    ticker: company.ticker || null,
    environment_score: company.environment_level || null,
    social_score: company.social_level || null,
    governance_score: company.governance_level || null,
    total_score: company.total_level || null,
    last_processing_date: company.last_processing_date || null,
  };
}

// ============================================================================
// ESG DATA (Environmental, Social, Governance Scores)
// ============================================================================

/**
 * FUNCTION: Get ESG scores for a product
 *
 * What is ESG?
 * - E (Environment): How much does the company care about nature? (pollution, recycling, etc.)
 * - S (Social): How well does the company treat people? (workers, communities, etc.)
 * - G (Governance): How honest and fair is the company? (leadership, ethics, etc.)
 *
 * What this does:
 * 1. Finds the product you're asking about
 * 2. Figures out which company makes it
 * 3. Looks up that company's ESG scores (ratings from 0-100)
 * 4. Sends back all three scores so you can see how ethical the company is
 *
 * How to use it:
 *   GET /api/products/3274080005003/esg
 *
 * What you get back:
 *   - Environment score (0-100): higher is better for the planet
 *   - Social score (0-100): higher means they treat people better
 *   - Governance score (0-100): higher means more trustworthy company
 */
const getProductESG = async (req, res) => {
  try {
    // STEP 1: Get the product ID from the URL
    const { id } = req.params;

    // STEP 2: Find the product information
    // First, check our cache (faster)
    const cached = await ProductCache.findOne({ code: id });
    let product;

    if (cached) {
      // Found in cache - use it!
      product = cached.data;
    } else {
      // Not in cache - get fresh data from OpenFoodFacts
      product = await lookupProductService({ upc: id });
    }

    // STEP 3: Make sure we know which company makes this product
    // Without company info, we can't look up ESG scores
    if (!product.company || !product.company.companyId) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message:
            "Company information not available for this product. ESG data cannot be retrieved.",
        },
      });
    }

    // STEP 4: Find the company in our database
    // We search by the brand name (like "Nestle", "Coca-Cola", etc.)
    const companyName = product.brand;
    const company = await Company.findOne({
      $or: [
        { name: { $regex: companyName, $options: "i" } }, // Search by company name
        { aliases: { $regex: companyName, $options: "i" } }, // Or by alternative names
      ],
    });

    // STEP 5: Make sure the company has ESG data
    if (!company || !company.esgSources || company.esgSources.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `No ESG data found for product brand: ${companyName}`,
        },
      });
    }

    // STEP 6: Get the most recent ESG data
    // Companies can have multiple ESG reports - we want the newest one
    const latestESG = company.esgSources.reduce((latest, source) => {
      // If we don't have a latest yet, use this one
      if (!latest) return source;

      // Compare dates to find the newest
      const latestAsOf = latest.asOf || new Date().toISOString();
      const sourceAsOf = source.asOf || new Date().toISOString();

      // Return whichever is newer
      return sourceAsOf > latestAsOf ? source : latest;
    });

    // STEP 7: Format and send back the ESG scores
    res.json({
      productId: id,
      productName: product.name,
      brand: product.brand,
      companyId: company._id.toString(),
      companyName: company.name,
      esgData: {
        environment: {
          score: latestESG.raw.E, // E = Environment score (0-100)
          description:
            "Environmental impact score (0-100, higher is better for Earth)",
        },
        social: {
          score: latestESG.raw.S, // S = Social score (0-100)
          description:
            "Social responsibility score (0-100, higher means treats people better)",
        },
        governance: {
          score: latestESG.raw.G, // G = Governance score (0-100)
          description:
            "Corporate governance score (0-100, higher means more trustworthy)",
        },
        scale: latestESG.raw.scale || "0-100",
      },
      dataSource: latestESG.source, // Where we got this data from
      asOf: latestESG.asOf, // When this data was collected
      lastUpdated: new Date().toISOString(), // Right now (when we sent this)
    });
  } catch (error) {
    // Handle errors

    // Error: Couldn't find the data
    if (error.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      });
    }

    // Error: Something went wrong on our server
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

/**
 * Get product alternatives using vector similarity search
 *
 * Route: GET /api/products/:id/alternatives
 * URL params: id (product ID)
 * Query params: limit (optional, default 5)
 *
 * This will use MongoDB vector search to find similar products
 * based on multiple factors:
 * - Product category
 * - Brand ethical ratings
 * - Price range
 * - Nutritional profile
 *
 * Example:
 *   GET /api/products/3274080005003/alternatives?limit=5
 *
 * TODO: Implement vector search when live data is ready
 */

const getProductAlternatives = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Import mongoose to access MongoDB directly
    const mongoose = (await import("mongoose")).default;
    const foodCollection = mongoose.connection.db.collection("food");
    const esgCollection = mongoose.connection.db.collection("esg_scores");

    // Use the outer getCompanyESG helper that includes brand mapping
    // Note: Make sure the outer getCompanyESG function has access to esgCollection
    const getCompanyESGWithCollection = async (brandName) => {
      if (!brandName) return null;

      // Map brand to parent company (e.g., "Great Value" → "Walmart")
      const companyName = getBrandCompanyName(brandName);

      // Clean up company name (remove extra spaces, commas, etc.)
      const cleanName = companyName.split(",")[0].trim();

      // Try exact match first
      let company = await esgCollection.findOne({
        name: { $regex: new RegExp(`^${cleanName}`, "i") },
      });

      // If not found, try partial match
      if (!company) {
        company = await esgCollection.findOne({
          name: { $regex: cleanName, $options: "i" },
        });
      }

      if (!company) return null;

      return {
        company_name: company.name,
        environment_score: company.environment_score || null,
        social_score: company.social_score || null,
        governance_score: company.governance_score || null,
        total_score: company.total_score || null,
        total_level: company.total_level || null,
        last_processing_date: company.last_processing_date || null,
      };
    };

    // Find product in food collection by code (barcode)
    const product = await foodCollection.findOne({ code: parseInt(id) });

    if (!product) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Product not found with ID: ${id}`,
        },
      });
    }

    // Check if product has embeddings
    if (!product.embedding || product.embedding.length === 0) {
      return res.json({
        productId: id,
        productName: product.product_name,
        alternatives: [],
        message:
          "Product does not have embeddings yet. Generate embeddings by running: POST /api/food/generate",
      });
    }

    // Get product's environmental grade
    const GRADE_SCORES = { a: 5, b: 4, c: 3, d: 2, e: 1, unknown: 0, "": 0 };
    const originalGrade = String(
      product.environmental_score_grade || ""
    ).toLowerCase();
    const originalScore = GRADE_SCORES[originalGrade] || 0;
    const isUnknownGrade = originalScore === 0;

    // Get categories - last one is most specific
    const categories = product.categories
      ? product.categories.split(",").map((c) => c.trim())
      : [];
    const specificCategory =
      categories.length > 0 ? categories[categories.length - 1] : "";
    const broadCategory =
      categories.length > 1 ? categories[categories.length - 2] : "";

    // Build query with flexible category matching
    const query = {
      _id: { $ne: product._id },
      embedding: { $exists: true, $ne: [] },
    };

    // Only filter by category if product has a known grade
    // Unknown products search ALL categories for any graded alternative
    if (!isUnknownGrade && specificCategory) {
      query.$or = [{ categories: { $regex: specificCategory, $options: "i" } }];
      if (broadCategory) {
        query.$or.push({
          categories: { $regex: broadCategory, $options: "i" },
        });
      }
    }

    const candidates = await foodCollection.find(query).toArray();

    // Calculate cosine similarity
    function cosineSimilarity(vecA, vecB) {
      const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
      const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
      const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    }

    // Use lower threshold for unknown grade products
    const similarityThreshold = isUnknownGrade ? 0.65 : 0.75;

    // Find better alternatives
    const alternatives = [];

    for (const candidate of candidates) {
      const similarity = cosineSimilarity(
        product.embedding,
        candidate.embedding
      );

      // Use dynamic threshold based on whether product has grade
      if (similarity > similarityThreshold) {
        const candidateGrade = String(
          candidate.environmental_score_grade || ""
        ).toLowerCase();
        const candidateScore = GRADE_SCORES[candidateGrade] || 0;

        // NEVER recommend unknown grade products as alternatives
        if (candidateScore === 0) continue;

        // For unknown products: show any graded alternative
        // For graded products: only show better grades
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

    // Sort by similarity first (most relevant), then grade improvement
    alternatives.sort((a, b) => {
      // Primary sort: similarity (higher is better)
      if (Math.abs(b.similarity - a.similarity) > 0.05) {
        return b.similarity - a.similarity;
      }
      // Secondary sort: grade improvement (or grade score for unknown products)
      return b.grade_improvement - a.grade_improvement;
    });

    // Enrich alternatives with company ESG data
    const enrichedAlternatives = await Promise.all(
      alternatives.slice(0, limit).map(async (alt) => {
        const companyESG = await getCompanyESGWithCollection(alt.brands);

        return {
          ...alt,
          company_esg: companyESG,
        };
      })
    );

    // Also get ESG for the original product
    const originalProductESG = await getCompanyESGWithCollection(
      product.brands
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

/*
 * HELPER FUNCTION
 * Receives an id, and returns a newly generated summary.
 *
 */
const generateProductSummary = async (id) => {
  try {
    // Get product details
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
      timeout: 60000,
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
    const cacheKey = `productsSummary:${companyKey}`;

    // Cache the normalized summary in Redis under per-company key
    await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(normalized));

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

/**
 * Gets an existing summary, or generates a new one for
 * an existing product if not found.
 *
 * Route: GET /api/products/:id/summary
 * URL params: id (product ID)
 *
 * This endpoint retrieves a previously generated summary from cache.
 * If no cached summary exists, a new one is generated.
 * If an error occurs, a 500 code is returned.
 *
 * Example:
 *   GET /api/products/3274080005003/summary
 */
const getProductSummary = async (req, res) => {
  try {
    const { id } = req.params;

    redisClient.get("productsSummary", async (err, summary) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: {
            code: "REDIS_ERROR",
            message: "Redis read failed",
          },
        });
      }

      if (summary != null) {
        return res.json(JSON.parse(summary));
      } else {
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
    });
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

/**
 * Export all controller functions
 * These will be imported by the routes file and mapped to endpoints
 */
export {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  getProductESG,
  getProductAlternatives,
  getProductSummary,
};
