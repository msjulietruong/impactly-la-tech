import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductSummarySections {
    overview?: string;
    ethicalConsiderations?: string;
    healthInfo?: string;
    alternatives?: string;
}

export interface IGenerationMeta {
    model?: string;
    version: string;
    tokensUsed?: number;
    generatedAt: Date;
    generatedBy: string;
}

export interface IDataSources {
    productData: boolean;
    esgData: boolean;
    externalSources?: string[];
}

export interface IProductSummary extends Document {
    productId: string;
    productName: string;
    brand?: string;

    shortSummary?: string;
    longSummary: string;

    sections?: IProductSummarySections;
    generationMeta: IGenerationMeta;
    dataSources: IDataSources;

    createdAt: Date;
    updatedAt: Date;
}

const productSummarySchema: Schema<IProductSummary> = new Schema(
    {
        productId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            description: "Product barcode or unique identifier",
            trim: true,
        },

        productName: {
            type: String,
            required: true,
            description: "Product name at time of summary generation",
        },

        brand: {
            type: String,
            description: "Product brand at time of summary generation",
        },

        shortSummary: {
            type: String,
            description: "Brief 1-2 sentence summary",
        },

        longSummary: {
            type: String,
            required: true,
            description:
                "Detailed AI-generated summary covering ethical considerations, health info, etc.",
        },

        sections: {
            overview: {
                type: String,
                description: "Product overview and description",
            },
            ethicalConsiderations: {
                type: String,
                description: "ESG factors, company ethics, sustainability",
            },
            healthInfo: {
                type: String,
                description:
                    "Nutritional information and health considerations",
            },
            alternatives: {
                type: String,
                description: "Suggested alternatives and why",
            },
        },

        generationMeta: {
            model: {
                type: String,
                description: "AI model used (e.g., gpt-4, claude-3)",
            },
            version: {
                type: String,
                default: "1.0.0",
                description: "Summary schema version",
            },
            tokensUsed: {
                type: Number,
                description: "Number of tokens used in generation",
            },
            generatedAt: {
                type: Date,
                default: Date.now,
                description: "When the summary was generated",
            },
            generatedBy: {
                type: String,
                default: "system",
                description: "User or system that triggered generation",
            },
        },

        dataSources: {
            productData: {
                type: Boolean,
                default: false,
                description: "OpenFoodFacts data included",
            },
            esgData: {
                type: Boolean,
                default: false,
                description: "Company ESG data included",
            },
            externalSources: {
                type: [String],
                description: "Additional sources consulted",
            },
        },
    },
    {
        timestamps: true,
    },
);

productSummarySchema.index(
    { updatedAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 30 },
);

productSummarySchema.index({ productId: 1 }, { unique: true });

const ProductSummary: Model<IProductSummary> = mongoose.model<IProductSummary>(
    "ProductSummary",
    productSummarySchema,
);

export default ProductSummary;
