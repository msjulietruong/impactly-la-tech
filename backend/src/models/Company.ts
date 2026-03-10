import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompany extends Document {
    ticker: string;
    name: string;
    logo?: string;
    web_url?: string;

    environmental_grade?: string;
    environmental_level?: string;
    social_grade?: string;
    social_level?: string;
    governance_grade?: string;
    governance_level?: string;

    environmental_score?: string;
    social_score?: string;
    governance_score?: string;
    total_score?: string;

    last_processing_date?: string;
    total_grade?: string;
    total_level?: string;

    cik?: number;

    createdAt: Date;
    updatedAt: Date;
}
// Main company/ESG schema
const companySchema: Schema<ICompany> = new Schema(
    {
        ticker: {
            type: String,
            required: true,
            description: 'Stock ticker symbol (e.g., "gm")',
        },
        name: {
            type: String,
            required: true,
            description: 'Official company name (e.g., "General Motors Co")',
        },
        logo: {
            type: String,
            description: "Company logo URL",
        },
        web_url: {
            type: String,
            description: "Company website URL",
        },
        environmental_grade: {
            type: String,
            description: "Environmental grade (A, B, C, etc.)",
        },
        environmental_level: {
            type: String,
            description: "Environmental level (High, Medium, Low)",
        },
        social_grade: {
            type: String,
            description: "Social grade (A, B, C, etc.)",
        },
        social_level: {
            type: String,
            description: "Social level (High, Medium, Low)",
        },
        governance_grade: {
            type: String,
            description: "Governance grade (A, B, C, etc.)",
        },
        governance_level: {
            type: String,
            description: "Governance level (High, Medium, Low)",
        },
        environmental_score: {
            type: Number,
            min: 0,
            max: 100,
            description: "Environmental score (0-100)",
        },
        social_score: {
            type: Number,
            min: 0,
            max: 100,
            description: "Social score (0-100)",
        },
        governance_score: {
            type: Number,
            min: 0,
            max: 100,
            description: "Governance score (0-100)",
        },
        total_score: {
            type: Number,
            min: 0,
            max: 100,
            description: "Total ESG score (0-100)",
        },
        last_processing_date: {
            type: String,
            description:
                'Date when ESG data was last processed (e.g., "04/17/2022")',
        },
        total_grade: {
            type: String,
            description: "Overall grade (A, BBB, etc.)",
        },
        total_level: {
            type: String,
            description: "Overall level (High, Medium, Low)",
        },
        cik: {
            type: Number,
            description: "SEC Central Index Key number",
        },
    },
    {
        timestamps: true,
        collection: "esg_scores", // Explicitly set collection name
    },
);

// Database indexes for better performance
companySchema.index({ ticker: 1 });
companySchema.index({ name: 1 });
companySchema.index({ name: "text" }); // Text search index

export const COMPANY_BRAND_MAP: Record<string, string> = {
    // Walmart brands
    walmart: "Walmart Inc",
    "great value": "Walmart Inc",
    "sam's choice": "Walmart Inc",
    marketside: "Walmart Inc",
    equate: "Walmart Inc",

    // Kroger brands
    kroger: "Kroger",
    "simple truth": "Kroger",
    "private selection": "Kroger",

    // Target brands
    target: "Target",
    "good & gather": "Target",
    "market pantry": "Target",

    // Costco brands
    costco: "Costco",
    "kirkland signature": "Costco",

    // General Mills brands
    "general mills": "General Mills Inc",
    cheerios: "General Mills Inc",
    "nature valley": "General Mills Inc",
    yoplait: "General Mills Inc",
    "lucky charms": "General Mills Inc",
    pillsbury: "General Mills Inc",
    "haagen-dazs": "General Mills Inc",
    "betty crocker": "General Mills Inc",
    "old el paso": "General Mills Inc",
    totino: "General Mills Inc",
    trix: "General Mills Inc",
    "cocoa puffs": "General Mills Inc",
    "cinnamon toast crunch": "General Mills Inc",
    "fiber one": "General Mills Inc",
    wheaties: "General Mills Inc",

    // PepsiCo brands
    pepsi: "PepsiCo",
    pepsico: "PepsiCo",
    "frito-lay": "PepsiCo",
    "lay's": "PepsiCo",
    lays: "PepsiCo",
    doritos: "PepsiCo",
    "mountain dew": "PepsiCo",
    gatorade: "PepsiCo",
    tropicana: "PepsiCo",
    quaker: "PepsiCo",
    tostitos: "PepsiCo",
    cheetos: "PepsiCo",
    ruffles: "PepsiCo",

    // Coca-Cola brands
    "coca-cola": "Coca-Cola",
    coke: "Coca-Cola",
    sprite: "Coca-Cola",
    fanta: "Coca-Cola",
    dasani: "Coca-Cola",
    "minute maid": "Coca-Cola",
    powerade: "Coca-Cola",
    vitaminwater: "Coca-Cola",

    // Nestlé brands
    nestle: "Nestlé",
    nescafe: "Nestlé",
    "kit kat": "Nestlé",
    "pure life": "Nestlé",
    gerber: "Nestlé",
    stouffer: "Nestlé",
    digiorno: "Nestlé",
    "hot pockets": "Nestlé",
    "lean cuisine": "Nestlé",
    butterfinger: "Nestlé",
    crunch: "Nestlé",

    // Kellogg's brands
    kelloggs: "Kellanova",
    "kellogg's": "Kellanova",
    pringles: "Kellanova",
    "cheez-it": "Kellanova",
    "frosted flakes": "Kellanova",
    "special k": "Kellanova",
    "pop-tarts": "Kellanova",
    "rice krispies": "Kellanova",
    eggo: "Kellanova",
    "nutri-grain": "Kellanova",

    // Mars brands
    mars: "Mars",
    "m&m's": "Mars",
    "m&m": "Mars",
    snickers: "Mars",
    twix: "Mars",
    "milky way": "Mars",
    skittles: "Mars",
    starburst: "Mars",

    // Mondelez brands
    oreo: "Mondelez",
    cadbury: "Mondelez",
    ritz: "Mondelez",
    trident: "Mondelez",
    "chips ahoy": "Mondelez",
    "wheat thins": "Mondelez",
    triscuit: "Mondelez",

    // Kraft Heinz brands
    kraft: "Kraft Heinz",
    heinz: "Kraft Heinz",
    "oscar mayer": "Kraft Heinz",
    philadelphia: "Kraft Heinz",
    velveeta: "Kraft Heinz",
    "capri sun": "Kraft Heinz",
    "jell-o": "Kraft Heinz",
    "maxwell house": "Kraft Heinz",
    planters: "Kraft Heinz",
    lunchables: "Kraft Heinz",
    "kool-aid": "Kraft Heinz",

    // Campbell brands
    campbell: "Campbell",
    "campbell's": "Campbell",
    "pepperidge farm": "Campbell",
    goldfish: "Campbell",
    v8: "Campbell",
    prego: "Campbell",
    swanson: "Campbell",

    // McCormick brands
    mccormick: "McCormick",
    french: "McCormick",
    "french's": "McCormick",
    "old bay": "McCormick",
    lawry: "McCormick",
    "lawry's": "McCormick",
    casero: "McCormick",

    // Hershey brands
    hershey: "Hershey",
    "hershey's": "Hershey",
    reese: "Hershey",
    "reese's": "Hershey",
    kisses: "Hershey",
    "jolly rancher": "Hershey",
    "ice breakers": "Hershey",

    // ConAgra brands
    conagra: "ConAgra",
    hunt: "ConAgra",
    "hunt's": "ConAgra",
    "reddi-wip": "ConAgra",
    "slim jim": "ConAgra",
    "healthy choice": "ConAgra",
    "marie callender": "ConAgra",
    "marie callender's": "ConAgra",
    "orville redenbacher": "ConAgra",
    "swiss miss": "ConAgra",
    vlasic: "ConAgra",

    // Hormel brands
    hormel: "Hormel",
    spam: "Hormel",
    skippy: "Hormel",
    "jennie-o": "Hormel",
    applegate: "Hormel",

    // Tyson brands
    tyson: "Tyson",
    "jimmy dean": "Tyson",
    "hillshire farm": "Tyson",
    "ball park": "Tyson",
};

// Create and export the Company model
const Company: Model<ICompany> = mongoose.model<ICompany>(
    "Company",
    companySchema,
    "esg_scores",
);

export default Company;
