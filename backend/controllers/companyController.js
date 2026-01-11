/**
 * ========================================
 * COMPANY CONTROLLER
 * ========================================
 *
 * This file handles everything related to companies:
 * - Finding a company by its ID, ticker (like "MSFT"), or name
 * - Getting ESG scores (ethics ratings) for companies
 * - Searching for companies
 *
 * HOW IT WORKS:
 * 1. Someone asks for company information
 * 2. We check what they're asking for (ID? Ticker? Name?)
 * 3. We look it up in our MongoDB database
 * 4. We send back the company information
 */

import Company from "../models/Company.js";

// ============================================================================
// COMPANY LOOKUP
// ============================================================================

/**
 * Get company by ID
 *
 * Route: GET /api/companies/:id
 * URL params: id (MongoDB ObjectId)
 *
 * Example:
 *   GET /api/companies/507f1f77bcf86cd799439011
 */
const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID parameter
        if (!id) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_ARGUMENT',
                    message: 'Company ID is required'
                }
            });
        }

        // Find company by MongoDB ID
        const company = await Company.findById(id);

        if (!company) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: `Company not found with ID: ${id}`
                }
            });
        }

        // Return formatted company data
        res.json(formatCompany(company));

    } catch (error) {
        console.error('Company lookup error:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get company details'
            }
        });
    }
};

/**
 * Get company by ticker, search query, or ID (legacy route)
 *
 * Route: GET /v1/company OR GET /v1/company/:id
 * URL params: id (optional, MongoDB ObjectId)
 * Query params:
 *   - ticker: stock ticker symbol (e.g., MSFT)
 *   - q: search query for company name
 *
 * Examples:
 *   GET /v1/company?ticker=MSFT
 *   GET /v1/company?q=microsoft
 *   GET /v1/company/507f1f77bcf86cd799439011
 */
const getCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { ticker, q } = req.query;

        let company;

        // Case 1: Lookup by MongoDB ID (from URL parameter)
        if (id) {
            company = await Company.findById(id);
            if (!company) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND',
                        message: `Company not found with ID: ${id}`
                    }
                });
            }

            return res.json(formatCompany(company));
        }

        // Case 2: Lookup by ticker symbol
        else if (ticker) {
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

            return res.json(formatCompany(company));
        }

        // Case 3: Search by company name or aliases
        else if (q) {
            const companies = await Company.find({
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { aliases: { $regex: q, $options: 'i' } }
                ]
            }).limit(10);

            return res.json({
                matches: companies.map(formatCompany),
                totalResults: companies.length
            });
        }

        // Case 4: No valid parameters provided
        else {
            return res.status(400).json({
                error: {
                    code: 'INVALID_ARGUMENT',
                    message: 'Missing required parameter. Provide either id, ticker, or q'
                }
            });
        }

    } catch (error) {
        console.error('Company lookup error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to lookup company'
            }
        });
    }
};

// ============================================================================
// ESG SCORES
// ============================================================================

/**
 * FUNCTION: Get ESG score for a company
 *
 * What this does:
 * - Calculates how "ethical" a company is based on 3 factors
 * - E (Environment): How much they care about Earth (40% of score)
 * - S (Social): How well they treat people (40% of score)
 * - G (Governance): How honest they are (20% of score)
 *
 * How to use it:
 *   GET /v1/score/507f1f77bcf86cd799439011
 *
 * What you get back:
 *   - Overall score (0-100): Higher = more ethical
 *   - Breakdown of E, S, G scores individually
 *   - Confidence level: How sure we are about this score
 */
const getCompanyScore = async (req, res) => {
    try {
        // STEP 1: Get the company ID from the URL
        const { companyId } = req.params;

        // STEP 2: Find the company in our database
        const company = await Company.findById(companyId);
        if (!company) {
            // Company doesn't exist
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: `Company not found with ID: ${companyId}`
                }
            });
        }

        // STEP 3: Check if this company has ESG data
        // (Not all companies have been rated yet)
        if (!company.esgSources || company.esgSources.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: `No ESG data found for company: ${company.name}`
                }
            });
        }

        // STEP 4: Get the most recent ESG data
        // Companies can have multiple ratings - we want the newest one
        const latestESG = company.esgSources.reduce((latest, source) => {
            if (!latest) return source;  // First one? Use it!

            // Compare dates to find which is newer
            const latestAsOf = latest.asOf || new Date().toISOString();
            const sourceAsOf = source.asOf || new Date().toISOString();

            return sourceAsOf > latestAsOf ? source : latest;
        });

        // STEP 5: Extract the three scores
        const { E, S, G } = latestESG.raw;
        // E = Environment (0-100)
        // S = Social (0-100)
        // G = Governance (0-100)

        // STEP 6: Set up how much each score matters (weights)
        // Default: Environment and Social are most important (40% each)
        // Governance is less important (20%)
        let weights = { wE: 0.4, wS: 0.4, wG: 0.2 };

        // STEP 7: If some scores are missing, adjust the weights
        // Example: If we only have E and S, they each count for 50%
        const availableFactors = [E, S, G].filter(score => score !== null);
        if (availableFactors.length < 3) {
            const equalWeight = 1.0 / availableFactors.length;
            weights = {
                wE: E !== null ? equalWeight : 0,
                wS: S !== null ? equalWeight : 0,
                wG: G !== null ? equalWeight : 0
            };
        }

        if (availableFactors.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: `ESG scores not available for company: ${company.name}`
                }
            });
        }

        // STEP 8: Calculate the overall score
        // This is like calculating your GPA - we use weighted averages
        const overall = Math.round(
            (E || 0) * weights.wE +    // Environment score × 40%
            (S || 0) * weights.wS +    // Social score × 40%
            (G || 0) * weights.wG      // Governance score × 20%
        );

        // STEP 9: Calculate confidence (how sure are we about this score?)
        let confidence = 0.80; // Start at 80% confidence

        // Bonus 1: If data is recent (less than 2 years old), add 5%
        if (latestESG.asOf) {
            const esgDate = new Date(latestESG.asOf);
            const monthsDiff = (new Date() - esgDate) / (1000 * 60 * 60 * 24 * 30);
            if (monthsDiff <= 24) {
                confidence += 0.05;
            }
        }

        // Bonus 2: If we have all three scores (E, S, G), add 5%
        if (E !== null && S !== null && G !== null) {
            confidence += 0.05;
        }

        // Maximum confidence is 95% (we can never be 100% sure)
        confidence = Math.min(confidence, 0.95);

        // STEP 10: Send back all the score information
        return res.json({
            companyId: companyId,
            companyName: company.name,
            overall,                   // The final score (0-100)
            breakdown: {
                environment: E,          // Environment score
                labor: S,                // Social/Labor score
                governance: G            // Governance score
            },
            methodology: {
                version: "1.0.0",
                weights: {
                    environment: weights.wE,   // How much E counts (usually 0.4 = 40%)
                    labor: weights.wS,         // How much S counts (usually 0.4 = 40%)
                    governance: weights.wG     // How much G counts (usually 0.2 = 20%)
                }
            },
            confidence,                // How confident we are (0.80 to 0.95)
            asOf: latestESG.asOf,      // When this data was collected
            lastUpdated: new Date().toISOString()  // Right now
        });

    } catch (error) {
        console.error('Score lookup error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get ESG score'
            }
        });
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * HELPER FUNCTION: Format company data
 *
 * This takes the messy data from MongoDB and cleans it up
 * into a nice, easy-to-use format for the frontend.
 *
 * What it does:
 * - Converts the weird MongoDB _id to a regular string
 * - Makes sure all arrays exist (even if empty)
 * - Adds timestamps for when the company was created/updated
 */
function formatCompany(company) {
    return {
        id: company._id.toString(),         // MongoDB ID as a string
        name: company.name,                 // Company name (e.g., "Microsoft")
        aliases: company.aliases || [],     // Other names (e.g., ["MSFT"])
        country: company.country,           // Where company is based
        tickers: company.tickers || [],     // Stock symbols (e.g., ["MSFT"])
        domains: company.domains || [],     // Websites (e.g., ["microsoft.com"])
        esgSources: company.esgSources || [], // ESG data sources
        meta: {
            createdAt: company.createdAt,     // When added to database
            updatedAt: company.updatedAt      // Last time we updated it
        }
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Export all controller functions
 * These will be imported by the routes file and mapped to endpoints
 */
export {
    getCompany,
    getCompanyById,
    getCompanyScore
};
