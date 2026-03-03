import Product, { ProductSummary, IProduct } from "../models/Product.js";
import ProductCache, { IProductCache } from "../models/ProductCache.js";
import EsgScore, { IEsgScore } from "../models/EsgScore.js";
import { ExtendedError, ErrorResponse } from "../models/Error.js";

import Company, { ICompany, COMPANY_BRAND_MAP } from "../models/Company.js";
import Brand, { IBrand } from "../models/Brand.js";

import mongoose from "mongoose";
import axios, { HttpStatusCode } from "axios";
import redisClient from "../utils/redisClient.js";
import {
    AGENT_API_ENDPOINT,
    AGENT_API_KEY,
    CACHE_TTL,
} from "../utils/config.js";

import { Request, Response } from "express";

interface ProductQueryParams {
    upc?: string;
    ean?: string;
    gtin?: string;
    q?: string;
}

interface EnrichedProduct {
    product: IProduct;
    esg: IEsgScore | null;
}

interface ProductAlternative {
    product: IProduct;
    esg?: IEsgScore;

    final_score: number;
    similarity: number;
    grade_improvement: number;
}

interface ProductAlternativeResponse {
    productId: string;
    productName: string | number;
    brand: string | string[] | number;
    environmental_score_grade: string | boolean;
    company_esg: IEsgScore | null;
    alternatives: ProductAlternative[];
    count: number;
    matchedCategory: string;
    isUnknownGrade: boolean;
    similarityThreshold: number;
    message?: string;
    implementation: {
        status: string;
        method?: string;
        features?: string[];
    };
}

function normalizeString(s: string): string {
    return s.trim().toLowerCase();
}

/**
 * Convert brand name to parent company name
 */
function getBrandCompanyName(
    brandName: string | null | undefined,
): string | null {
    if (!brandName) return null;
    const normalized = brandName.toLowerCase().trim();
    return COMPANY_BRAND_MAP[normalized] || brandName;
}

function calculateEsg(E: number, S: number, G: number): number {
    const scores = { E, S, G };
    const available = Object.entries(scores).filter(([, v]) => v !== null);

    if (available.length === 0) return 0;

    const equalWeight = 1 / available.length;

    let wE: number = equalWeight;
    let wS: number = equalWeight;
    let wG: number = equalWeight;
    if (available.length === 3) {
        wE = 0.4;
        wS = 0.4;
        wG = 0.2;
    }

    const result = Math.round(
        (E ?? 0) * (E !== null ? wE : 0) +
            (S ?? 0) * (S !== null ? wS : 0) +
            (G ?? 0) * (G !== null ? wG : 0),
    );

    return result;
}

export function parseStrictInt(
    value: string | null | undefined,
    fallback: number = 0,
): number {
    if (value == null) return fallback;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? fallback : n;
}

function coalesceStrictString(
    values: (string | null | undefined)[],
    defaultValue: string,
): string {
    for (const v of values) {
        if (v != null && v.trim() !== "") {
            return v;
        }
    }
    return defaultValue;
}

async function getProductESGData(
    brandName: string | null | undefined,
): Promise<IEsgScore | null> {
    if (!brandName) return null;

    try {
        const companyName: string | null = getBrandCompanyName(brandName);

        const brand: IBrand | null = await Brand.findOne({
            name: { $regex: companyName, $options: "i" },
        });

        if (!brand) {
            console.warn("Brand not found.");
            return null;
        }

        let esgScore: IEsgScore | null = await EsgScore.findOne({
            brand_id: brand.id,
        });

        if (!esgScore) {
            console.warn("Esg Score missing for brand.");
            return null;
        }

        let overall: number = esgScore.score_final ?? 0;
        if (overall === 0) {
            const E: number = esgScore.score_environmental ?? 0;
            const S: number = esgScore.score_social ?? 0;
            const G: number = esgScore.score_governance ?? 0;
            if (E + S + G === 0) {
                console.warn("Total Esg Score is 0.");
                return null;
            }
            overall = calculateEsg(E, S, G);

            esgScore.score_final = overall;
        }

        return esgScore;
    } catch (error) {
        console.error("Error fetching ESG data:", error);
        return null;
    }
}

// PRODUCT SEARCH AND LISTING
// ============================================================================

async function lookupProductByCode(code: string): Promise<IProduct> {
    await new Promise((resolve) => setTimeout(resolve));

    const parsedCode: number = parseStrictInt(code, 0);
    const product: IProduct | null = await Product.findOne({
        code: parsedCode,
    });

    if (!product) {
        const error = new ExtendedError(`Product not found with code: ${code}`);
        error.code = "NOT_FOUND";
        throw error;
    }

    return product;
}

async function lookupProductById(id: string): Promise<IProduct> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new ExtendedError(
            `Failed to search product due to invalid id provided: ${id}`,
        );
        error.code = "NOT_FOUND";
        throw error;
    }

    const product: IProduct | null = await Product.findById(id);

    if (!product) {
        const error = new ExtendedError(
            `Product not found with internal product id: ${id}`,
        );
        error.code = "NOT_FOUND";
        throw error;
    }

    return product;
}

function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function lookupProductByQuery(
    query: string | null,
    limit: number = 10,
): Promise<IProduct[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    let result: IProduct[] = [];

    if (query === null) {
        return result;
    }

    const searchTerm = escapeRegex(query);
    result = await Product.find({
        $or: [
            {
                product_name: { $regex: searchTerm, $options: "i" },
            },
            {
                brands: { $regex: searchTerm, $options: "i" },
            },
            {
                description: { $regex: searchTerm, $options: "i" },
            },
        ],
    }).limit(limit);
    // console.log(result);

    if (result.length === 0) {
        const error = new ExtendedError(`No products found matching: ${query}`);
        error.code = "NOT_FOUND";
        throw error;
    }

    return result;
}

type IngredientRating = {
    score: number;
    category: string;
};

// TODO(liam): this is only for testing purposes,
// it may be better to reference this via DB in the future.
const INGREDIENTS: Record<string, IngredientRating> = {
    sugar: { score: -2, category: "sweetener" },
    spinach: { score: 4, category: "vegetable" },
    "sodium benzoate": { score: -1, category: "preservative" },
};

interface IngredientResult {
    name: string;
    rating: IngredientRating;
}

interface ProductRiskFlags {
    averageScore: number;
    breakdown: IngredientResult[];
}

function getProductRiskFlags(ingredients: string[]): ProductRiskFlags {
    if (!Array.isArray(ingredients)) {
        return {
            averageScore: 0,
            breakdown: [],
        };
    }

    const ratings: IngredientResult[] = ingredients.map((ingredient) => {
        const key = normalizeString(ingredient);
        return {
            name: key,
            rating: INGREDIENTS[key] ?? { score: 0, category: "unknown" },
        };
    });

    const total = ratings.reduce((sum, r) => sum + r.rating.score, 0);

    return {
        averageScore: total / ratings.length,
        breakdown: ratings,
    };
}

async function getEnrichedProduct(product: IProduct): Promise<EnrichedProduct> {
    const esgScore = await getProductESGData(product.brand);

    const riskFlags = getProductRiskFlags(product.ingredients ?? []);

    const enrichedProduct = {
        product: product.toObject(),
        esg: esgScore?.toObject() ?? null,
        risk_flags: riskFlags,
    };

    return enrichedProduct;
}

async function searchProducts(req: Request, res: Response): Promise<Response> {
    const { query } = req.params;
    const productQuery = query as string;
    const limit: number = parseStrictInt(
        req.query.limit as string | undefined,
        5,
    );

    try {
        if (productQuery === null) {
            return res.status(400).json({
                error: {
                    code: "INVALID_ARGUMENT",
                    message: "Missing required parameters.",
                },
            } as ErrorResponse);
        }
        let products = await lookupProductByQuery(productQuery ?? "", limit);

        const enriched_products: EnrichedProduct[] = await Promise.all(
            products.map(getEnrichedProduct),
        );

        return res.json({ enriched_products });
    } catch (error) {
        const encodedError = error as ExtendedError;

        if (encodedError.code) {
            return res.status(404).json({
                error: {
                    code: encodedError.code,
                    message: encodedError.message,
                },
            } as ErrorResponse);
        }

        console.error("Product search error:", error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to search products",
            },
        } as ErrorResponse);
    }
}

async function getProducts(req: Request, res: Response): Promise<Response> {
    try {
        const { upc, ean, gtin, q } = req.query as ProductQueryParams;
        const limit: number = parseStrictInt(
            req.query.limit as string | undefined,
            5,
        );

        let products: IProduct[];
        if (!upc && !ean && !gtin && !q) {
            try {
                products = [(await Product.findOne({})) as IProduct];

                return res.json({ products });
            } catch (error) {
                let error_code: string = "SERVER_ERROR";
                let return_code: number = 400;
                let error_message: string;

                if (error instanceof ExtendedError) {
                    const serviceError = error as ExtendedError;
                    error_code = coalesceStrictString(
                        [serviceError.code],
                        error_code,
                    );
                    error_message = serviceError.message;
                } else {
                    const anyError = error as Error;
                    error_message = anyError.message;
                }

                return res.status(return_code).json({
                    error: {
                        code: error_code,
                        message: error_message,
                    },
                } as ErrorResponse);
            }
        }

        try {
            const code: string = coalesceStrictString([upc, ean, gtin], "");
            if (code === "") {
                if (q === null) {
                    return res.status(400).json({
                        error: {
                            code: "INVALID_ARGUMENT",
                            message: "Missing required parameters.",
                        },
                    } as ErrorResponse);
                }
                products = await lookupProductByQuery(q ?? "", limit);
            } else {
                products = [await lookupProductByCode(code)];
            }
        } catch (error) {
            let error_code: string = "SERVER_ERROR";
            let return_code: number = 400;
            let error_message: string;

            if (error instanceof ExtendedError) {
                const serviceError = error as ExtendedError;
                error_code = coalesceStrictString(
                    [serviceError.code],
                    error_code,
                );
                error_message = serviceError.message;
            } else {
                const anyError = error as Error;
                error_message = anyError.message;
            }

            return res.status(return_code).json({
                error: {
                    code: error_code,
                    message: error_message,
                },
            } as ErrorResponse);
        }

        const enriched_products: EnrichedProduct[] = await Promise.all(
            products.map(getEnrichedProduct),
        );

        return res.json({ enriched_products });
    } catch (error) {
        const encodedError = error as ExtendedError;

        if (encodedError.code) {
            return res.status(404).json({
                error: {
                    code: encodedError.code,
                    message: encodedError.message,
                },
            } as ErrorResponse);
        }

        console.error("Product search error:", error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to search products",
            },
        } as ErrorResponse);
    }
}

async function getProductById(req: Request, res: Response): Promise<Response> {
    try {
        const { id } = req.params;
        const productId = id as string;

        if (!productId) {
            return res.status(400).json({
                error: {
                    code: "INVALID_ARGUMENT",
                    message: "Product ID is required",
                },
            } as ErrorResponse);
        }

        const cached = (await ProductCache.findOne({
            id: productId,
        })) as IProductCache | null;

        if (cached) {
            return res.json(cached.data);
        }

        const product: IProduct = await lookupProductById(productId);

        const enriched_product = await getEnrichedProduct(product);

        return res.json(enriched_product);
    } catch (error) {
        const encodedError = error as ExtendedError;

        if (encodedError.code === "NOT_FOUND") {
            return res.status(404).json({
                error: {
                    code: encodedError.code,
                    message: `Product not found with ID: ${req.params.id}`,
                },
            } as ErrorResponse);
        }

        console.error("Product lookup error:", error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get product details",
            },
        } as ErrorResponse);
    }
}

async function getProductByCode(
    req: Request,
    res: Response,
): Promise<Response> {
    try {
        const { code } = req.params;
        const productCode = code as string;

        if (!productCode) {
            return res.status(400).json({
                error: {
                    code: "INVALID_ARGUMENT",
                    message: "Product Code is required",
                },
            } as ErrorResponse);
        }

        const cached = (await ProductCache.findOne({
            code: productCode,
        })) as IProductCache | null;

        if (cached) {
            return res.json(cached.data);
        }

        const product: IProduct = await lookupProductByCode(productCode);

        const enriched_product = await getEnrichedProduct(product);

        return res.json(enriched_product);
    } catch (error) {
        const customError = error as ExtendedError;

        if (customError.code === "NOT_FOUND") {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: `Product not found with Code: ${req.params.code}`,
                },
            } as ErrorResponse);
        }

        console.error("Product lookup error:", error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get product details",
            },
        } as ErrorResponse);
    }
}

// ============================================================================
// HELPER FUNCTION: Get company ESG with collection
// ============================================================================
// async function getCompanyESGWithCollection(brandName, esgCollection) {
//   if (!brandName) return null;

//   const companyName = getBrandCompanyName(brandName);
//   const cleanName = companyName.split(",")[0].trim();

//   let company = await esgCollection.findOne({
//     name: { $regex: new RegExp(`^${cleanName}`, "i") },
//   });

//   if (!company) {
//     company = await esgCollection.findOne({
//       name: { $regex: cleanName, $options: "i" },
//     });
//   }

//   if (!company) return null;

//   return {
//     company_name: company.name,
//     ticker: company.ticker || null,
//     environment_score: company.environment_score || null,
//     environment_level: company.environment_level || null,
//     social_score: company.social_score || null,
//     social_level: company.social_level || null,
//     governance_score: company.governance_score || null,
//     governance_level: company.governance_level || null,
//     total_score: company.total_score || null,
//     total_level: company.total_level || null,
//     last_processing_date: company.last_processing_date || null,
//   };
// }

// ============================================================================
// ESG DATA (Environmental, Social, Governance Scores)
// ============================================================================
// NOTE(Liam): this seems to be a duplicate because the first two gets (ID and Code)
//             both return with the ESG Score attached already...
// const getProductESG = async (
//   req: Request,
//   res: Response,
// ): Promise<Response> => {
//   try {
//     const { id } = req.params;
//     const productId = id as string;

//     if (!productId) {
//       return res.status(400).json({
//         error: {
//           code: "INVALID_ARGUMENT",
//           message: "Product ID is required",
//         },
//       } as ErrorResponse);
//     }

//     const cached = await ProductCache.findOne({ code: productId });
//     let product: Product | Product[];

//     if (cached) {
//       product = cached.data;
//     } else {
//       try {
//         if (/^\d+$/.test(productId)) {
//           product = await lookupProductService({ upc: productId });
//         } else {
//           product = await lookupProductService({
//             gtin: productId,
//           });
//         }

//         if (Array.isArray(product)) {
//           product = product[0];
//         }
//       } catch (error) {
//         const customError = error as CustomError;

//         if (customError.code === "NOT_FOUND") {
//           return res.status(404).json({
//             error: {
//               code: "NOTE_FOUND",
//               message: `Product not found with ID: ${productId}`,
//             },
//           } as ErrorResponse);
//         }

//         console.error("Product esg lookup");
//       }
//     }

//     if (!product || !product.brand) {
//       return res.status(404).json({
//         error: {
//           code: "NOT_FOUND",
//           message:
//             "Brand information not available for this product. ESG data cannot be retrieved.",
//         },
//       });
//     }

//     const companyName = getBrandCompanyName(product.brand);
//     const company = await Company.findOne({
//       name: { $regex: companyName, $options: "i" },
//     });

//     if (!company) {
//       return res.status(200).json({
//         error: {
//           code: "NOT_FOUND",
//           message: `No ESG data found for product brand: ${companyName}`,
//         },
//       });
//     }

//     const E = company.environment_score ?? null;
//     const S = company.social_score ?? null;
//     const G = company.governance_score ?? null;
//     let overall = company.total_score ?? null;

//     if (overall === null && (E !== null || S !== null || G !== null)) {
//       const availableFactors = [E, S, G].filter((score) => score !== null);
//       const weights = {
//         wE:
//           E !== null
//             ? availableFactors.length === 3
//               ? 0.4
//               : 1.0 / availableFactors.length
//             : 0,
//         wS:
//           S !== null
//             ? availableFactors.length === 3
//               ? 0.4
//               : 1.0 / availableFactors.length
//             : 0,
//         wG:
//           G !== null
//             ? availableFactors.length === 3
//               ? 0.2
//               : 1.0 / availableFactors.length
//             : 0,
//       };
//       overall = Math.round(
//         (E || 0) * weights.wE + (S || 0) * weights.wS + (G || 0) * weights.wG,
//       );
//     }

//     res.json({
//       productId: id,
//       productName: product.name,
//       brand: product.brand,
//       companyId: company._id.toString(),
//       companyName: company.name,
//       esgData: {
//         environment: {
//           score: E,
//           grade: company.environment_grade || null,
//           level: company.environment_level || null,
//           description:
//             "Environmental impact score (0-100, higher is better for Earth)",
//         },
//         social: {
//           score: S,
//           grade: company.social_grade || null,
//           level: company.social_level || null,
//           description:
//             "Social responsibility score (0-100, higher means treats people better)",
//         },
//         governance: {
//           score: G,
//           grade: company.governance_grade || null,
//           level: company.governance_level || null,
//           description:
//             "Corporate governance score (0-100, higher means more trustworthy)",
//         },
//         overall: {
//           score: overall,
//           grade: company.total_grade || null,
//           level: company.total_level || null,
//           description: "Overall ESG score (weighted average of E, S, G)",
//         },
//         scale: "0-100",
//       },
//       lastProcessingDate: company.last_processing_date,
//       lastUpdated: new Date().toISOString(),
//     });
//   } catch (error) {
//     if (error.code === "NOT_FOUND") {
//       return res.status(404).json({
//         error: {
//           code: "NOT_FOUND",
//           message: error.message,
//         },
//       });
//     }

//     console.error("ESG lookup error:", error);
//     res.status(500).json({
//       error: {
//         code: "INTERNAL_ERROR",
//         message: "Failed to get ESG data for product",
//       },
//     });
//   }
// };

// ============================================================================
// PRODUCT ALTERNATIVES (VECTOR SEARCH)
// ============================================================================

export function calculateCosineSimilarity(
    vecA: number[],
    vecB: number[],
): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

async function getBrandCompany(
    brandName: string | undefined | null,
): Promise<ICompany | null> {
    if (!brandName) return null;

    const companyName: string = getBrandCompanyName(brandName) ?? "";
    const cleanName = companyName.split(",")[0].trim();

    if (cleanName === "") {
        return null;
    }

    let company = await Company.findOne({
        name: { $regex: new RegExp(`^${cleanName}`, "i") },
    });

    if (!company) {
        company = await Company.findOne({
            name: { $regex: cleanName, $options: "i" },
        });
    }

    if (!company) return null;

    return company;
}

function buildCandidateQuery(product: IProduct, isUnknownGrade: boolean) {
    const categories =
        product.categories?.split(",").map((c) => c.trim()) || [];
    const specificCategory = categories[categories.length - 1];
    const broadCategory = categories[categories.length - 2];

    const query: any = {
        _id: { $ne: product._id },
        embedding: { $exists: true, $ne: [] },
    };

    if (!isUnknownGrade && specificCategory) {
        query.$or = [
            { categories: { $regex: specificCategory, $options: "i" } },
        ];
        if (broadCategory) {
            query.$or.push({
                categories: { $regex: broadCategory, $options: "i" },
            });
        }
    }

    return { query, specificCategory, broadCategory };
}

// TODO(liam): fix Food Model and then fix this
async function getProductAlternatives(
    req: Request,
    res: Response,
): Promise<Response> {
    try {
        const { code } = req.params;
        const productCode = code as string;
        const limit: number = parseStrictInt(
            req.query.limit as string | undefined,
            5,
        );

        if (!productCode) {
            return res.status(400).json({
                error: {
                    code: "INVALID_ARGUMENT",
                    message: "Product Code is required",
                },
            } as ErrorResponse);
        }

        const dbconn = mongoose.default.connection.db;
        if (!dbconn) {
            return res.status(500).json({
                error: {
                    code: "DB_ERROR",
                    message: "Cannot establish connection to database.",
                },
            } as ErrorResponse);
        }

        // Use the outer getCompanyESG helper that includes brand mapping
        // Note: Make sure the outer getCompanyESG function has access to esgCollection

        // Find product in food collection by code (barcode)
        const product: IProduct = await lookupProductByCode(productCode);

        if (!product) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: `Product not found with Code: ${productCode}`,
                },
            } as ErrorResponse);
        }

        // Check if product has embeddings
        if (!product.embedding || product.embedding.length === 0) {
            return res.json({
                productId: product.id,
                productName: product.name,
                brand: product.brand,
                environmental_score_grade: false,
                company_esg: null,
                alternatives: [],
                count: 0,
                matchedCategory: "",
                isUnknownGrade: true,
                similarityThreshold: 0,
                message:
                    "Product does not have embeddings yet. Generate embeddings by running: POST /api/food/generate",
                implementation: {
                    status: "inactive",
                },
            } satisfies ProductAlternativeResponse);
        }

        const enrichedProduct = await getEnrichedProduct(product);
        const company = await getBrandCompany(enrichedProduct.product.brand);

        if (company === null) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: `Product company was not found: ${enrichedProduct.product.brand}`,
                },
            } as ErrorResponse);
        }

        // Get product's environmental grade
        const GRADE_SCORES: Record<string, number> = {
            a: 5,
            b: 4,
            c: 3,
            d: 2,
            e: 1,
            "": 0,
        } as const;

        const originalGrade: string = coalesceStrictString(
            [company.environmental_grade],
            "",
        ).toLowerCase();
        const originalScore = GRADE_SCORES[originalGrade] || 0;
        const isUnknownGrade = originalScore <= 0;
        const similarityThreshold = isUnknownGrade ? 0.65 : 0.75;

        const query = buildCandidateQuery(product, isUnknownGrade);
        const specificCategory = query.specificCategory;
        const broadCategory = query.broadCategory;

        // const product: IProduct | null = await Product.findOne({
        //   code: { $regex: product.code, $options: "i" },
        // });

        let productEnvironmentScoreGrade: string | boolean = false;
        if (product) {
            productEnvironmentScoreGrade =
                enrichedProduct.product.environmental_score_grade ?? false;
        } else {
            console.warn("Product's data could not be found.");
        }

        const candidates: IProduct[] = await Product.find(query);

        const alternatives = [];

        for (const candidate of candidates) {
            const similarity = calculateCosineSimilarity(
                product.embedding,
                candidate.embedding ?? Array(product.embedding.length).fill(0),
            );

            if (similarity > similarityThreshold) {
                const candidateGrade = String(
                    candidate.environmental_score_grade || "",
                ).toLowerCase();
                const candidateScore = GRADE_SCORES[candidateGrade] || 0;

                if (candidateScore === 0) continue;

                const shouldInclude = isUnknownGrade
                    ? true
                    : candidateScore > originalScore;

                if (shouldInclude) {
                    const altEsgScore: IEsgScore | undefined =
                        (await getProductESGData(candidate.brand)) ?? undefined;
                    const overallScore: number = altEsgScore?.score_final || 0;

                    alternatives.push({
                        product: candidate,
                        esg: altEsgScore,

                        final_score: overallScore,
                        similarity: Math.round(similarity * 100) / 100,
                        grade_improvement: isUnknownGrade
                            ? candidateScore
                            : candidateScore - originalScore,
                    } satisfies ProductAlternative);
                }
            }
        }

        // Sort by similarity first (most relevant), then grade improvement
        alternatives.sort((a, b) => {
            if (Math.abs(b.similarity - a.similarity) > 0.05) {
                return b.similarity - a.similarity;
            }
            return b.grade_improvement - a.grade_improvement;
        });

        const limitedAlternatives = alternatives.slice(0, limit);

        // Also get ESG for the original product
        // const originalProductESG = await getProductESGData(product.brand);

        let return_message: string = isUnknownGrade
            ? "Showing graded alternatives from all categories (original product has no environmental data)"
            : "";

        return res.json({
            productId: enrichedProduct.product.id,
            productName: enrichedProduct.product.name,
            brand: enrichedProduct.product.brand,
            environmental_score_grade: productEnvironmentScoreGrade,
            company_esg: enrichedProduct.esg,
            alternatives: limitedAlternatives,
            count: limitedAlternatives.length,
            matchedCategory: isUnknownGrade
                ? "all categories"
                : specificCategory || broadCategory || "",
            isUnknownGrade: isUnknownGrade,
            similarityThreshold: similarityThreshold,
            message: return_message,
            implementation: {
                status: "active",
                method: "Vector search using HuggingFace embeddings with ESG enrichment",
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
        } satisfies ProductAlternativeResponse);
    } catch (error) {
        console.error("Alternatives lookup error:", error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get product alternatives",
            },
        } as ErrorResponse);
    }
}

// NOTE(liam): flag ingredients endpoint
// const checkProductIngredients = async (id) => {
//   try {
//     if (!id) {
//       throw new Error("Product id is required");
//     }

//     // Try cache first (only barcodes are cached)
//     let product = null;
//     const cached = await ProductCache.findOne({ code: id });
//     if (cached) {
//       product = cached.data;
//     } else {
//       try {
//         // Use barcode lookup when id is numeric, otherwise try gtin
//         if (/^\d+$/.test(String(id))) {
//           product = await lookupProductService({ upc: String(id) });
//         } else {
//           product = await lookupProductService({ gtin: String(id) });
//         }

//         if (Array.isArray(product)) product = product[0];
//       } catch (err) {
//         // If lookup fails, return a descriptive result instead of throwing
//         console.error("Ingredient check: product lookup failed", err);
//         return {
//           productId: id,
//           ok: false,
//           error: {
//             code: err.code || "LOOKUP_FAILED",
//             message: err.message || String(err),
//           },
//         };
//       }
//     }

//     if (!product) {
//       return {
//         productId: id,
//         ok: false,
//         error: { code: "NOT_FOUND", message: "Product not found" },
//       };
//     }

//     // Extract ingredients text from common fields
//     let ingredientsText = "";
//     if (product.ingredients_text) {
//       ingredientsText = String(product.ingredients_text);
//     } else if (product.ingredients_text_en) {
//       ingredientsText = String(product.ingredients_text_en);
//     } else if (product.ingredients && Array.isArray(product.ingredients)) {
//       ingredientsText = product.ingredients
//         .map((ing) => (ing && (ing.text || ing)) || "")
//         .filter(Boolean)
//         .join(", ");
//     } else if (product.ingredients) {
//       ingredientsText = String(product.ingredients);
//     }

//     if (!ingredientsText || ingredientsText.trim() === "") {
//       return {
//         productId: id,
//         productName: product.product_name || product.name || null,
//         brand: product.brands || product.brand || null,
//         ok: true,
//         message: "No ingredients information available for this product",
//       };
//     }

//     const normalized = ingredientsText.toLowerCase();

//     // Define allergen and concern patterns (not exhaustive)
//     const ALLERGEN_PATTERNS = {
//       milk: /\b(milk|casein|whey|lactose|buttermilk|milk powder|skimmilk)\b/i,
//       eggs: /\b(egg|albumen|albumin)\b/i,
//       peanuts: /\b(peanut|groundnut)\b/i,
//       tree_nuts:
//         /\b(almond|walnut|pecan|cashew|hazelnut|pistachio|macadamia|brazil nut)\b/i,
//       soy: /\b(soy|soya|soybean|soy lecithin|soy protein)\b/i,
//       wheat_gluten: /\b(wheat|gluten|farina|semolina|spelt|durum|kamut)\b/i,
//       fish: /\b(fish|anchovy|cod|salmon|tuna|trout|herring|pollock)\b/i,
//       shellfish:
//         /\b(shellfish|shrimp|prawn|crab|lobster|crayfish|clam|mussel|oyster)\b/i,
//       sesame: /\b(sesame|tahini)\b/i,
//     };

//     const CONCERN_PATTERNS = {
//       palm_oil: /\b(palm oil|palmolein)\b/i,
//       high_fructose_corn_syrup: /\b(high[- ]fructose corn syrup|hfcs)\b/i,
//       artificial_colors:
//         /\b(red 40|yellow 5|yellow 6|blue 1|caramel color|artificial color|tartrazine|allura red)\b/i,
//       preservatives:
//         /\b(bht|bha|sodium benzoate|potassium sorbate|sorbate|sulfite|sulphite|nitrite|nitrate|propionate)\b/i,
//       trans_fat: /\b(hydrogenated|partially hydrogenated|trans fat)\b/i,
//       msg: /\b(mononatrium glutamate|monosodium glutamate|msg)\b/i,
//       artificial_sweeteners:
//         /\b(aspartame|sucralose|acesulfame|saccharin|neotame)\b/i,
//       high_sugar: /\b(sugar|corn syrup|glucose syrup|fructose)\b/i,
//     };

//     const foundAllergens = {};
//     const foundConcerns = {};

//     for (const [k, re] of Object.entries(ALLERGEN_PATTERNS)) {
//       foundAllergens[k] = re.test(normalized);
//     }

//     for (const [k, re] of Object.entries(CONCERN_PATTERNS)) {
//       foundConcerns[k] = re.test(normalized);
//     }

//     const matchedAllergens = Object.keys(foundAllergens).filter(
//       (k) => foundAllergens[k],
//     );
//     const matchedConcerns = Object.keys(foundConcerns).filter(
//       (k) => foundConcerns[k],
//     );

//     const safe = matchedAllergens.length === 0 && matchedConcerns.length === 0;

//     return {
//       productId: id,
//       productName: product.product_name || product.name || null,
//       brand: product.brands || product.brand || null,
//       ingredients: ingredientsText,
//       found: {
//         allergens: foundAllergens,
//         concerns: foundConcerns,
//       },
//       matchedAllergens,
//       matchedConcerns,
//       safe,
//     };
//   } catch (err) {
//     console.error("checkProductIngredients error:", err);
//     return {
//       productId: id,
//       ok: false,
//       error: {
//         code: err.code || "INTERNAL_ERROR",
//         message: err.message || String(err),
//       },
//     };
//   }
// };

// ============================================================================
// PRODUCT SUMMARIES (AI-GENERATED)
// ============================================================================

/*
 * creates an ai-generated summary for a product,
 * OR gets a cached summary from the redis database.
 *
 */
async function generateProductSummary(code: string): Promise<IProduct> {
    try {
        const cached = (await ProductCache.findOne({
            code: code,
        })) as IProductCache | null;

        let product: IProduct | null;
        if (cached) {
            console.log("[redis] Cache hit:", cached);
            product = cached.data;
        } else {
            console.log("[redis] Cache miss!");
            product = await lookupProductByCode(code);
        }

        if (!product) {
        }

        const agentUrl = `${AGENT_API_ENDPOINT.replace(/\/$/, "")}/workflow/run`;

        const headers = {
            "x-internal-key": AGENT_API_KEY,
        };

        const payload = {
            product_identifier: code,
        };

        console.info(
            "Calling summary agent:",
            agentUrl,
            "payload keys:",
            Object.keys(payload),
        );

        const res = await axios.post(agentUrl, payload, {
            headers,
            timeout: 100000,
        });

        if (!res || !res.data) {
            throw new Error("Agent did not respond.") as ExtendedError;
        }

        const finalReport = res.data || {};

        const summary: ProductSummary = {
            data: finalReport.summary || [],
            metadata: finalReport.metadata || {},
            generatedAt: new Date().toISOString(),
        };
        product.summary = summary;

        const companyRaw: string = product.brand || code;
        const companyKey: string =
            encodeURIComponent(
                companyRaw
                    .split(",")[0]
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "_"),
            ) || code;
        const cacheKey = `brandSummary:${companyKey}`;

        console.log(`[redis] caching with key: '${cacheKey}'`);

        await redisClient.set(cacheKey, JSON.stringify(product), {
            EX: CACHE_TTL,
        });

        return product;
    } catch (error) {
        const encodedError = error as ExtendedError;
        console.error(
            "Failed to generate a product summary:",
            encodedError.message,
        );
        throw encodedError;
    }
}

async function getProductSummary(
    req: Request,
    res: Response,
): Promise<Response> {
    try {
        const { code } = req.params;
        const productCode = code as string;

        const product: IProduct = await generateProductSummary(productCode);

        return res.json(product);
    } catch (error) {
        const encodedError = error as ExtendedError;
        console.error(error);
        return res.status(500).json({
            error: {
                code: encodedError.code || "INTERNAL_ERROR",
                message: encodedError.message,
            },
        } as ErrorResponse);
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    searchProducts,
    getProducts,
    getProductById,
    getProductByCode,
    getProductAlternatives,
    generateProductSummary,
    getProductSummary,
};
