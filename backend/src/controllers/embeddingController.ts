import { Request, Response } from "express";
// import Food, { IFood } from "../models/Food.js";
import Product, { IProduct } from "../models/Product.js";
import { ObjectId } from "mongodb";
import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";
import { ExtendedError, ErrorResponse } from "../models/Error.js";
import {
    parseStrictInt,
    calculateCosineSimilarity,
} from "./productController.js";

interface GradeScores {
    [key: string]: number;
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    "": number;
}

// Grade ranking (A is best, E is worst)
const GRADE_SCORES: GradeScores = { a: 5, b: 4, c: 3, d: 2, e: 1, "": 0 };

// Initialize embedding model (loads once)
let globalEmbedder: FeatureExtractionPipeline | null = null;

async function getEmbedder(): Promise<FeatureExtractionPipeline> {
    if (!globalEmbedder) {
        console.log("Loading embedding model...");
        globalEmbedder = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2",
        );
        console.log("Embedding model loaded.");
    }
    return globalEmbedder;
}

// Create embedding from product
async function createEmbeddingFromProduct(product: IProduct) {
    const embedder = await getEmbedder();

    const text = `${product.name || ""} ${product.categories || ""} ${product.brand || ""}`;
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}

interface GenerateEmbeddingResponse {
    success: boolean;
    embedded: number;
    message?: string;
}

async function generateEmbeddings(
    req: Request,
    res: Response,
): Promise<Response> {
    try {
        const totalProducts = Product.countDocuments();
        console.log("Total products in collection:", totalProducts);

        // Check a sample product
        const sampleProduct = await Product.findOne({});
        console.log("Sample product embedding:", sampleProduct?.embedding);
        console.log(
            "Sample product embedding type:",
            typeof sampleProduct?.embedding,
        );
        console.log(
            "Sample product embedding length:",
            sampleProduct?.embedding?.length,
        );

        const products: IProduct[] = await Product.find({
            $or: [
                { embedding: { $exists: false } },
                { embedding: { $size: 0 } },
                { embedding: null },
            ],
        });

        console.log("Products found needing embeddings:", products.length);
        if (products.length === 0) {
            console.log("First product:", products[0].name);
            console.log("First product embedding:", products[0].embedding);
            return res.json({
                success: true,
                message: "All products already have embeddings",
                embedded: 0,
            } satisfies GenerateEmbeddingResponse);
        }

        let count = 0;
        for (const product of products) {
            const embedding = await createEmbeddingFromProduct(product);
            await Product.updateOne(
                { _id: product._id },
                { $set: { embedding } },
            );
            count++;
            console.log(
                `Embedded: ${product.name} (${count}/${products.length})`,
            );
        }

        return res.json({
            success: true,
            embedded: count,
            message: `Successfully generated embeddings for ${count} products`,
        } satisfies GenerateEmbeddingResponse);
    } catch (error) {
        const extendedError = error as ExtendedError;
        console.error("Error generating embeddings:", extendedError);
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: extendedError.message,
            },
        } satisfies ErrorResponse);
    }
}

async function searchProducts(req: Request, res: Response): Promise<Response> {
    try {
        const { query } = req.params;

        const products = Product.find({
            product_name: { $regex: query, $options: "i" },
        }).limit(10);

        return res.json(products);
    } catch (error) {
        const extendedError = error as ExtendedError;
        console.error("Error searching products:", extendedError);
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: extendedError.message,
            },
        } satisfies ErrorResponse);
    }
}

async function debugGradeStats(req: Request, res: Response): Promise<Response> {
    try {
        const gradeStats = await Product.aggregate([
            {
                $group: {
                    _id: "$environmental_score_grade",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        const totalProducts = Product.countDocuments();
        const withEmbeddings = Product.countDocuments({
            embedding: { $exists: true, $ne: [] },
        });
        const withGrades = Product.countDocuments({
            environmental_score_grade: { $nin: ["unknown", "", null] },
        });

        return res.json({
            totalProducts,
            withEmbeddings,
            withGrades,
            gradeBreakdown: gradeStats,
        });
    } catch (error) {
        const extendedError = error as ExtendedError;
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: extendedError.message,
            },
        } satisfies ErrorResponse);
    }
}

export { getEmbedder, generateEmbeddings, searchProducts, debugGradeStats };
