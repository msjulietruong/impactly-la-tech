const Company = require('../models/Company');

const companyController = {
  getCompany: async (req, res) => {
    try {
      const { id } = req.params;
      const { ticker, q } = req.query;

      // Validate input parameters
      if (!id && !ticker && !q) {
        return res.status(400).json({
          error: {
            code: 'INVALID_ARGUMENT',
            message: 'Missing required parameter. Provide either id, ticker, or q'
          }
        });
      }

      let company;

      if (id) {
        // Load by MongoDB _id
        company = await Company.findById(id);
      } else if (ticker) {
        // Case-insensitive match on tickers array
        company = await Company.findOne({
          tickers: { $regex: new RegExp(`^${ticker}$`, 'i') }
        });
      } else if (q) {
        // Case-insensitive regex search on name or aliases
        const companies = await Company.find({
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { aliases: { $regex: q, $options: 'i' } }
          ]
        }).limit(10);

        return res.status(200).json({
          matches: companies.map(formatCompanyResponse)
        });
      }

      if (!company) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Company not found with ${id ? 'ID' : 'ticker'}: ${id || ticker}`
          }
        });
      }

      res.status(200).json(formatCompanyResponse(company));
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

// Helper function to format company response
function formatCompanyResponse(company) {
  return {
    id: company._id.toString(),
    name: company.name,
    aliases: company.aliases || [],
    country: company.country,
    tickers: company.tickers || [],
    domains: company.domains || [],
    esgSources: company.esgSources || [],
    meta: {
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    }
  };
}

module.exports = companyController;
