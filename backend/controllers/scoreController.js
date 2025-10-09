import Company from '../models/Company.js';

// Get ESG score for a company by ID
export const getScore = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Find company by ID
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ 
        error: {
          code: 'NOT_FOUND',
          message: `Company not found with ID: ${companyId}`
        }
      });
    }

    // Check if company has ESG data
    if (!company.esgSources || company.esgSources.length === 0) {
      return res.status(404).json({ 
        error: {
          code: 'NOT_FOUND',
          message: `No ESG data found for company: ${companyId}`
        }
      });
    }

    // Get the latest ESG data
    const latestESG = company.esgSources.reduce((latest, source) => {
      if (!latest) return source;

      const latestAsOf = latest.asOf || new Date().toISOString();
      const sourceAsOf = source.asOf || new Date().toISOString();

      return sourceAsOf > latestAsOf ? source : latest;
    });

    const { E, S, G } = latestESG.raw;

    // Calculate weights (default: E=40%, S=40%, G=20%)
    let weights = { wE: 0.4, wS: 0.4, wG: 0.2 };

    // If some scores are missing, redistribute weights equally
    const availableFactors = [E, S, G].filter(score => score !== null);
    if (availableFactors.length < 3) {
      const equalWeight = 1.0 / availableFactors.length;
      weights = {
        wE: E !== null ? equalWeight : 0,
        wS: S !== null ? equalWeight : 0,
        wG: G !== null ? equalWeight : 0
      };
    }

    // Calculate overall score
    const overall = Math.round(
      (E || 0) * weights.wE +
      (S || 0) * weights.wS +
      (G || 0) * weights.wG
    );

    // Calculate confidence score
    let confidence = 0.80;

    // Add 0.05 if data is recent (within 24 months)
    if (latestESG.asOf) {
      const esgDate = new Date(latestESG.asOf);
      const monthsDiff = (new Date() - esgDate) / (1000 * 60 * 60 * 24 * 30);
      if (monthsDiff <= 24) {
        confidence += 0.05;
      }
    }

    // Add 0.05 if all E/S/G scores are available
    if (E !== null && S !== null && G !== null) {
      confidence += 0.05;
    }

    // Cap confidence at 0.95
    confidence = Math.min(confidence, 0.95);

    // Return the score data
    res.json({
      companyId: companyId,
      companyName: company.name,
      overall,
      breakdown: {
        environment: E,
        labor: S,
        governance: G
      },
      methodology: {
        version: "1.0.0",
        weights: {
          environment: weights.wE,
          labor: weights.wS,
          governance: weights.wG
        }
      },
      confidence,
      asOf: latestESG.asOf,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Score lookup error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get ESG score'
      }
    });
  }
};
