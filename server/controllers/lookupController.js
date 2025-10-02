const openFoodFactsService = require('../services/openFoodFactsService');

const lookupController = {
  lookupProduct: async (req, res) => {
    try {
      const { upc, ean, gtin, q } = req.query;
      
      const result = await openFoodFactsService.lookupProduct({
        upc, ean, gtin, q
      });

      res.status(200).json(result);
    } catch (error) {
      const status = error.status || 500;
      const response = {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'An internal error occurred'
        }
      };

      if (error.details) {
        response.error.details = error.details;
      }

      res.status(status).json(response);
    }
  }
};

module.exports = lookupController;
