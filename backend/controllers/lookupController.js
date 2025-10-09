import { lookupProduct as lookupProductService } from '../services/openFoodFactsService.js';

// Get product by barcode or search query
export const lookupProduct = async (req, res) => {
  try {
    const { upc, ean, gtin, q } = req.query;
    const { code } = req.params; // For /api/products/barcode/:code route

    // Validate that at least one parameter is provided
    if (!upc && !ean && !gtin && !q && !code) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ARGUMENT',
          message: 'Missing required parameters. Provide either upc, ean, gtin, q, or code in URL'
        }
      });
    }

    // Get product data from service
    // If code is in params (from barcode route), use it as upc
    const product = await lookupProductService({
      upc: code || upc, 
      ean, 
      gtin, 
      q
    });

    // Return the product data
    res.json(product);

  } catch (error) {
    // Handle different error types
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ 
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    if (error.code === 'INVALID_ARGUMENT') {
      return res.status(400).json({ 
        error: {
          code: 'INVALID_ARGUMENT',
          message: error.message
        }
      });
    }

    // Default server error
    console.error('Product lookup error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to lookup product'
      }
    });
  }
};
