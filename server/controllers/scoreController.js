import Company from '../models/Company.js';

const scoreController = {
  getScore: async (req, res) => {
    try {
      const { companyId } = req.params;

      // Load company by _id
      const company = await Company.findById(companyId);

      if (!company) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Company not found with ID: ${companyId}`
          }
        });
      }

      if (!company.esgSources || company.esgSources.length === 0) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `No ESG data found for company: ${companyId}`
          }
        });
      }

      // Get the latest ESG entry by asOf (or newest if asOf missing)
      const latestESG = company.esgSources.reduce((latest, source) => {
        if (!latest) return source;

        const latestAsOf = latest.asOf || new Date().toISOString();
        const sourceAsOf = source.asOf || new Date().toISOString();

        return sourceAsOf > latestAsOf ? source : latest;
      });

      const { E, S, G } = latestESG.raw;

      // Default weights
      let weights = { wE: 0.4, wS: 0.4, wG: 0.2 };

      // Re-normalize weights if any scores are null
      const availableFactors = [E, S, G].filter(score => score !== null);
      if (availableFactors.length < 3) {
        const factorCount = availableFactors.length;
        const equalWeight = 1.0 / factorCount;

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

      // Calculate confidence
      let confidence = 0.80;

      // +0.05 if asOf ≤ 24 months old
      if (latestESG.asOf) {
        const esgDate = new Date(latestESG.asOf);
        const monthsDiff = (new Date() - esgDate) / (1000 * 60 * 60 * 24 * 30);
        if (monthsDiff <= 24) {
          confidence += 0.05;
        }
      }

      // +0.05 if none of E/S/G is null
      if (E !== null && S !== null && G !== null) {
        confidence += 0.05;
      }

      // Cap at 0.95
      confidence = Math.min(confidence, 0.95);

      const scoreResponse = {
        companyId: companyId,
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
      };

      res.status(200).json(scoreResponse);
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

export default scoreController;
