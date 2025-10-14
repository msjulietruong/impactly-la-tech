import { lookupProduct as lookupProductService } from '../services/openFoodFactsService.js';
import ProductCache from '../models/ProductCache.js';
import Company from '../models/Company.js';

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
          code: 'INVALID_ARGUMENT',
          message: 'Missing required parameters. Provide either upc, ean, gtin, or q for search'
        }
      });
    }

    // STEP 3: Look up the product using our OpenFoodFacts service
    // This service talks to a big database of food products
    const product = await lookupProductService({
      upc,    // Barcode number (if provided)
      ean,    // Another type of barcode (if provided)
      gtin,   // Yet another type of barcode (if provided)
      q       // Search words (if provided)
    });

    // STEP 4: Send the product information back to whoever asked for it
    res.json(product);

  } catch (error) {
    // STEP 5: Handle errors - things that went wrong

    // Error type 1: Product not found
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ 
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    // Error type 2: Bad request (user sent wrong information)
    if (error.code === 'INVALID_ARGUMENT') {
      return res.status(400).json({ 
        error: {
          code: 'INVALID_ARGUMENT',
          message: error.message
        }
      });
    }

    // Error type 3: Something unexpected went wrong on our server
    console.error('Product search error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search products'
      }
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
          code: 'INVALID_ARGUMENT',
          message: 'Product ID is required'
        }
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
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ 
        error: {
          code: 'NOT_FOUND',
          message: `Product not found with ID: ${req.params.id}`
        }
      });
    }

    // Error: Something went wrong on our end
    console.error('Product lookup error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get product details'
      }
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
          code: 'INVALID_ARGUMENT',
          message: 'Barcode is required'
        }
      });
    }

    // Get product data using barcode
    const product = await lookupProductService({ upc: code });

    res.json(product);

  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ 
        error: {
          code: 'NOT_FOUND',
          message: `Product not found with barcode: ${req.params.code}`
        }
      });
    }

    console.error('Barcode lookup error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to lookup product by barcode'
      }
    });
  }
};

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
          code: 'NOT_FOUND',
          message: 'Company information not available for this product. ESG data cannot be retrieved.'
        }
      });
    }

    // STEP 4: Find the company in our database
    // We search by the brand name (like "Nestle", "Coca-Cola", etc.)
    const companyName = product.brand;
    const company = await Company.findOne({
      $or: [
        { name: { $regex: companyName, $options: 'i' } },      // Search by company name
        { aliases: { $regex: companyName, $options: 'i' } }    // Or by alternative names
      ]
    });

    // STEP 5: Make sure the company has ESG data
    if (!company || !company.esgSources || company.esgSources.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `No ESG data found for product brand: ${companyName}`
        }
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
          score: latestESG.raw.E,   // E = Environment score (0-100)
          description: 'Environmental impact score (0-100, higher is better for Earth)'
        },
        social: {
          score: latestESG.raw.S,   // S = Social score (0-100)
          description: 'Social responsibility score (0-100, higher means treats people better)'
        },
        governance: {
          score: latestESG.raw.G,   // G = Governance score (0-100)
          description: 'Corporate governance score (0-100, higher means more trustworthy)'
        },
        scale: latestESG.raw.scale || '0-100'
      },
      dataSource: latestESG.source,              // Where we got this data from
      asOf: latestESG.asOf,                      // When this data was collected
      lastUpdated: new Date().toISOString()      // Right now (when we sent this)
    });

  } catch (error) {
    // Handle errors

    // Error: Couldn't find the data
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ 
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    // Error: Something went wrong on our server
    console.error('ESG lookup error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get ESG data for product'
      }
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

    // Get the original product
    const cached = await ProductCache.findOne({ code: id });
    let product;

    if (cached) {
      product = cached.data;
    } else {
      product = await lookupProductService({ upc: id });
    }

    // TODO: Implement MongoDB vector search
    // For now, return a placeholder response
    res.json({
      productId: id,
      productName: product.name,
      alternatives: [],
      message: 'Vector search for alternatives will be implemented when live data is ready',
      implementation: {
        status: 'pending',
        plannedFeatures: [
          'MongoDB Atlas Vector Search',
          'Similarity based on category, brand ethics, price, and nutrition',
          'Configurable similarity threshold',
          'Sorted by ethical score'
        ]
      }
    });

  } catch (error) {
    console.error('Alternatives lookup error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get product alternatives'
      }
    });
  }
};

// ============================================================================
// PRODUCT SUMMARIES (AI-GENERATED)
// ============================================================================

/**
 * Generate AI summary for a product using LangChain
 * 
 * Route: POST /api/products/:id/summary
 * URL params: id (product ID)
 * 
 * This endpoint:
 * 1. Gathers product data (ingredients, nutrition, ESG scores)
 * 2. Uses LangChain to generate a comprehensive summary
 * 3. Caches the summary for future retrieval
 * 4. Returns the generated summary
 * 
 * Example:
 *   POST /api/products/3274080005003/summary
 * 
 * TODO: Implement LangChain integration when ready
 */
const generateProductSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Get product details
    const cached = await ProductCache.findOne({ code: id });
    let product;

    if (cached) {
      product = cached.data;
    } else {
      product = await lookupProductService({ upc: id });
    }

    // TODO: Implement LangChain summary generation
    // For now, return a placeholder response
    const summary = {
      productId: id,
      productName: product.name,
      summary: 'AI-generated summary will be available when LangChain integration is complete',
      generatedAt: new Date().toISOString(),
      implementation: {
        status: 'pending',
        plannedFeatures: [
          'LangChain integration for AI summaries',
          'Summary includes: product overview, ethical considerations, health info',
          'Cached summaries with TTL',
          'Support for multiple languages'
        ]
      }
    };

    res.json(summary);

  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate product summary'
      }
    });
  }
};

/**
 * Get cached AI summary for a product
 * 
 * Route: GET /api/products/:id/summary
 * URL params: id (product ID)
 * 
 * This endpoint retrieves a previously generated summary from cache.
 * If no cached summary exists, returns 404.
 * 
 * Example:
 *   GET /api/products/3274080005003/summary
 * 
 * TODO: Implement summary caching when LangChain is integrated
 */
const getProductSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement summary retrieval from cache
    // For now, return a placeholder response
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'No cached summary found. Use POST /api/products/:id/summary to generate one.'
      },
      implementation: {
        status: 'pending',
        note: 'Summary caching will be implemented with LangChain integration'
      }
    });

  } catch (error) {
    console.error('Summary retrieval error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve product summary'
      }
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
  generateProductSummary,
  getProductSummary
};

