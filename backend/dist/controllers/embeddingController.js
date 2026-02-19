// import Food, { IFood } from "../models/Food.js";
import Product from "../models/Product.js";
import { pipeline } from "@xenova/transformers";
// Grade ranking (A is best, E is worst)
const GRADE_SCORES = { a: 5, b: 4, c: 3, d: 2, e: 1, "": 0 };
// Initialize embedding model (loads once)
let globalEmbedder = null;
async function getEmbedder() {
    if (!globalEmbedder) {
        console.log("Loading embedding model...");
        globalEmbedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        console.log("Embedding model loaded.");
    }
    return globalEmbedder;
}
// Create embedding from product
async function createEmbeddingFromProduct(product) {
    const embedder = await getEmbedder();
    const text = `${product.name || ""} ${product.categories || ""} ${product.brand || ""}`;
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}
async function generateEmbeddings(req, res) {
    try {
        const totalProducts = Product.countDocuments();
        console.log("Total products in collection:", totalProducts);
        // Check a sample product
        const sampleProduct = await Product.findOne({});
        console.log("Sample product embedding:", sampleProduct?.embedding);
        console.log("Sample product embedding type:", typeof sampleProduct?.embedding);
        console.log("Sample product embedding length:", sampleProduct?.embedding?.length);
        const products = await Product.find({
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
            });
        }
        let count = 0;
        for (const product of products) {
            const embedding = await createEmbeddingFromProduct(product);
            await Product.updateOne({ _id: product._id }, { $set: { embedding } });
            count++;
            console.log(`Embedded: ${product.name} (${count}/${products.length})`);
        }
        return res.json({
            success: true,
            embedded: count,
            message: `Successfully generated embeddings for ${count} products`,
        });
    }
    catch (error) {
        const extendedError = error;
        console.error("Error generating embeddings:", extendedError);
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: extendedError.message,
            },
        });
    }
}
async function searchProducts(req, res) {
    try {
        const { query } = req.params;
        const products = Product.find({
            product_name: { $regex: query, $options: "i" },
        }).limit(10);
        return res.json(products);
    }
    catch (error) {
        const extendedError = error;
        console.error("Error searching products:", extendedError);
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: extendedError.message,
            },
        });
    }
}
async function debugGradeStats(req, res) {
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
    }
    catch (error) {
        const extendedError = error;
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: extendedError.message,
            },
        });
    }
}
export { getEmbedder, generateEmbeddings, searchProducts, debugGradeStats };
