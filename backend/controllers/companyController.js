import Company from "../models/Company.js";

// Get company by ID, ticker, or search query
export const getCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { ticker, q } = req.query;

    let company;

    if (id) {
      // Find company by MongoDB ID
      company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({ 
          error: {
            code: 'NOT_FOUND',
            message: `Company not found with ID: ${id}`
          }
        });
      }
      
      res.json(formatCompany(company));
      
    } else if (ticker) {
      // Find company by ticker symbol (case-insensitive)
      company = await Company.findOne({
        tickers: { $regex: new RegExp(`^${ticker}$`, 'i') }
      });
      
      if (!company) {
        return res.status(404).json({ 
          error: {
            code: 'NOT_FOUND',
            message: `Company not found with ticker: ${ticker}`
          }
        });
      }
      
      res.json(formatCompany(company));
      
    } else if (q) {
      // Search companies by name or aliases
      const companies = await Company.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { aliases: { $regex: q, $options: 'i' } }
        ]
      }).limit(10);

      res.json({
        matches: companies.map(formatCompany),
        totalResults: companies.length
      });
      
    } else {
      // No valid parameters provided
      return res.status(400).json({
        error: {
          code: 'INVALID_ARGUMENT',
          message: 'Missing required parameter. Provide either id, ticker, or q'
        }
      });
    }

  } catch (error) {
    console.error('Company lookup error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to lookup company'
      }
    });
  }
};

// Helper function to format company data for response
function formatCompany(company) {
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
