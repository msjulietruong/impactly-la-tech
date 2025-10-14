# 🌍 Impactly - Backend

A simple backend API that helps you find out how ethical companies are!

---

## 🎯 What Does This Do?

This backend provides three main things:

1. **Search for products** - Find products by name or barcode
2. **Get product details** - See ingredients, nutrition, and company info
3. **Check company ethics** - Find out how good (or bad) a company is

---

## 🚀 Quick Start (3 Easy Steps!)

### Step 1: Install Node.js

Make sure you have Node.js installed (version 18 or higher).
Check by running: `node --version`

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

This downloads all the code libraries we need (takes 1-2 minutes).

### Step 3: Create .env File

Create a file called `.env` in the backend folder with these lines:

```
MONGODB_URI=your_mongodb_connection_string_here
OFF_ENV=staging
OFF_USER_AGENT=EthicalProductFinder/0.1 (your_email@example.com)
TEST_TICKER=MSFT
PORT=3001
```

3. **Ingest ESG data** (optional):
   ```bash
   npm run ingest:esg
   ```

### Step 4: Start the Server

```bash
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 3001
```

That's it! Your server is now running! 🎉

---

## 🧪 Testing (Make Sure It Works!)

Once your server is running, open a NEW terminal and run:

```bash
cd backend
.\quick-test.ps1
```

You should see **all 3 tests pass**:
```
✓ Test 1: Search for products - PASSED
✓ Test 2: Get product details - PASSED  
✓ Test 3: Get ESG scores - PASSED
```

---

## 📚 How to Use the API

The backend runs on `http://localhost:3001`

### 1. Search for Products

```
GET http://localhost:3001/api/products?q=chocolate
```

Searches for all products with "chocolate" in the name.

### 2. Get Product Details

```
GET http://localhost:3001/api/products/3274080005003
```

Shows all info about a specific product (use the barcode as the ID).

### 3. Get ESG Scores (Ethics Ratings)

```
GET http://localhost:3001/api/products/[PRODUCT_ID]/esg
```

Shows how ethical the company is:
- **Environment Score** (0-100): Higher = better for Earth 🌱
- **Social Score** (0-100): Higher = treats people better 👥
- **Governance Score** (0-100): Higher = more honest ⚖️

---

## 📁 Project Structure (Where Everything Is)

```
backend/
├── server.js              ← Main file - starts the server
├── controllers/           ← Functions that handle requests
│   ├── productController.js   ← Product search & details
│   ├── companyController.js   ← Company & ESG scores
│   └── healthController.js    ← Health check
├── models/                ← Database schemas (data structure)
│   ├── Company.js             ← Company data structure
│   ├── ProductCache.js        ← Cached product data
│   └── ProductSummary.js      ← AI summaries (future)
├── routes/                ← URL endpoints
│   └── index.js               ← All routes defined here
├── middleware/            ← Helper code that runs before routes
│   ├── errorHandler.js        ← Handles all errors
│   └── validateObjectId.js    ← Checks MongoDB IDs are valid
├── services/              ← External API connections
│   └── openFoodFactsService.js ← Talks to food database
└── tests/                 ← Automated tests
    ├── api.spec.js            ← Main test file
    └── setup.js               ← Test configuration
```

---

## 🛠️ Available Commands

```bash
npm start          # Start the server
npm run dev        # Start with auto-restart (for development)
npm test           # Run automated tests
npm run ingest:esg # Import ESG data from CSV
```

#### `GET /v1/company/:id`
Get company by MongoDB ID.

#### `GET /v1/score/:companyId`
Get ESG score breakdown for a company.

### Start Here:
1. Open `server.js` - This is the main file, read the STEP comments
2. Open `routes/index.js` - See all the URL endpoints
3. Open `controllers/productController.js` - See how products work
4. Open `controllers/companyController.js` - See how ESG scoring works

### Each file has:
- ✅ Simple comments explaining what it does
- ✅ STEP-by-step explanations in the code
- ✅ Examples showing how to use it
- ✅ No complex jargon - just plain English!

---

## ❌ Common Problems & Solutions

### Problem: "Cannot connect to MongoDB"
**Solution:** Check your `.env` file has the correct `MONGODB_URI`

### Problem: "Port 3001 already in use"
**Solution:** Another program is using port 3001. Either:
- Stop the other program, OR
- Change `PORT=3002` in your `.env` file

### Problem: "Module not found"
**Solution:** Run `npm install` again

### Problem: "ESG data not found"
**Solution:** This is normal! Not all products/brands have ESG data yet.

---

## 🔄 How Data Flows

```
1. Frontend sends request → http://localhost:3001/api/products?q=chocolate

2. Server receives it → server.js

3. Routes it to the right controller → routes/index.js

4. Controller processes it → controllers/productController.js
   ↓
   Might call external API (OpenFoodFacts)
   Might query MongoDB database
   ↓
5. Returns formatted data → JSON response

6. Frontend receives the data!
```

---

## Development Scripts

- `npm run dev` - Start development server with nodemon (auto-restart)
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run ingest:esg` - Ingest ESG data from CSV
- `npm run verify` - Ingest data and run tests

---

##  Next Steps (testing)

### To connect your own dataset:
1. Update the `MONGODB_URI` in `.env` with your database
2. Import your data using `npm run ingest:esg`
3. The API will automatically work with your data!

### To connect the frontend:
1. Make sure this backend is running (`npm start`)
2. In your frontend code, call: `fetch('http://localhost:3001/api/products?q=search')`
3. The backend will respond with JSON data!

---

## 📖 API Documentation

### Endpoint 1: Search Products
- **URL:** `GET /api/products?q=search_term`
- **Example:** `/api/products?q=chocolate`
- **Returns:** Product info with name, brand, image, etc.

### Endpoint 2: Product Details
- **URL:** `GET /api/products/:id`
- **Example:** `/api/products/3274080005003`
- **Returns:** Full product details including ingredients and nutrition

### Endpoint 3: ESG Breakdown
- **URL:** `GET /api/products/:id/esg`
- **Example:** `/api/products/3274080005003/esg`
- **Returns:** Environment, Social, and Governance scores

### Bonus Endpoints:
- `GET /health` - Check if server is running
- `GET /v1/company?ticker=MSFT` - Find company by stock ticker
- `GET /v1/score/:companyId` - Get ESG score for a company

---

## CSV Data Ingestion

To load ESG data from CSV:

1. Place your CSV file at `backend/data/dataset.csv`
2. Run: `npm run ingest:esg`

Expected CSV columns:
- `ticker`, `name`, `currency`, `exchange`, `industry`, `weburl`
- `environment_score`, `social_score`, `governance_score`, `total_score`
- `last_processing_date`, `environment_grade`, `environment_level`
- `social_grade`, `social_level`, `governance_grade`, `governance_level`
- `total_grade`, `total_level`, `cik`

---

## Future Features

### Coming Soon
- **Vector Search**: MongoDB Atlas Vector Search for product alternatives
- **AI Summaries**: LangChain integration for intelligent product summaries
- **Batch Operations**: Bulk product lookups
- **Webhooks**: Real-time ESG data updates
- **Rate Limiting**: API rate limiting and authentication

### Ready for Live Data
All endpoints are designed to work seamlessly with live data. The current implementation includes:
- Placeholder responses for AI features
- Database models ready for vector search
- Clear TODO comments in code for easy implementation
- Well-documented API contracts

When the frontend team is ready, simply:
1. Connect to live MongoDB Atlas instance
2. Implement LangChain service (see `productController.js`)
3. Set up vector search indexes (see `ProductSummary.js`)

---

## Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `INVALID_ARGUMENT` | 400 | Missing or invalid request parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests (OpenFoodFacts) |
| `INTERNAL_ERROR` | 500 | Server error |
| `EXTERNAL_SERVICE_ERROR` | 500 | External API failure |

---

## 🤝 Need Help?

1. Check the code comments first
2. Run `npm test` to see what's broken
3. Check the error messages - they tell you what's wrong!
4. Run tests before committing

---

## ✅ Checklist Before Showing Your Project

- [ ] Server starts without errors
- [ ] All 3 quick tests pass
- [ ] Can search for products
- [ ] Can get product details
- [ ] MongoDB is connected
- [ ] ESG scores are working

---

## License

This project is part of the LA Tech hackathon project "Impactly".
