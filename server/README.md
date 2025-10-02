# Ethical Product Finder Backend

A Node.js + Express + MongoDB backend API that provides ethical product information by integrating with OpenFoodFacts and ESG data sources.

## Features

- **Product Lookup**: Barcode scanning and text search via OpenFoodFacts API
- **Company Information**: ESG data integration with company profiles
- **Ethical Scoring**: Weighted ESG scoring methodology
- **Caching**: MongoDB-based caching for improved performance

## Environment Variables

Create a `.env` file in the server directory:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/ethical-product-finder

# OpenFoodFacts Configuration
OFF_ENV=staging
OFF_USER_AGENT=EthicalProductFinder/0.1 (you@example.com)

# Server Configuration
PORT=3000
NODE_ENV=development

# Test Configuration (optional)
TEST_TICKER=MSFT
```

## Quick Start

### One-Command Setup (Recommended)

1. **Setup environment**:
   ```bash
   cd server
   cp env.example .env
   # Edit .env with your MongoDB URI and settings
   ```

2. **Run complete verification**:
   ```bash
   # For bash/zsh users:
   npm run verify:sh
   
   # For PowerShell users:
   npm run verify:ps
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

### Manual Setup

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Setup environment**:
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB URI and settings
   ```

3. **Ingest ESG data and run tests**:
   ```bash
   npm run verify
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## CSV Ingestion

To load ESG data from CSV:

1. **Place your CSV file** at `server/data/dataset.csv`
2. **Run ingestion**:
   ```bash
   npm run ingest:esg
   ```

The script expects CSV columns:
- `ticker,name,currency,exchange,industry,weburl`
- `environment_score,social_score,governance_score,total_score`
- `last_processing_date,environment_grade,environment_level`
- `social_grade,social_level,governance_grade,governance_level`
- `total_grade,total_level,cik`

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run ingestion and tests together
npm run verify
```

Tests will skip database-dependent features when `MONGODB_URI` is not set.

## API Examples

### Health Check
```bash
curl http://localhost:3000/health
```

### Product Lookup
```bash
# By barcode
curl "http://localhost:3000/v1/lookup?upc=3274080005003"

# By text search
curl "http://localhost:3000/v1/lookup?q=chocolate"
```

### Company Information
```bash
# By ticker symbol
curl "http://localhost:3000/v1/company?ticker=MSFT"

# By search query
curl "http://localhost:3000/v1/company?q=nestle"

# By MongoDB ID
curl "http://localhost:3000/v1/company/507f1f77bcf86cd799439011"
```

### ESG Score
```bash
curl "http://localhost:3000/v1/score/507f1f77bcf86cd799439011"
```

## Scoring Methodology

ESG scores are calculated using weighted factors:
- **Environment**: 40% weight
- **Labor/Social**: 40% weight  
- **Governance**: 20% weight

Formula: `overall = round(E×0.4 + S×0.4 + G×0.2)`

If any factor is null, weights are redistributed equally among available factors.

Confidence calculation:
- Base: 0.80
- +0.05 if data is ≤24 months old
- +0.05 if all E/S/G scores are available
- Maximum: 0.95

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run ingest:esg` - Ingest ESG data from CSV
- `npm test` - Run test suite
- `npm run verify` - Ingest data and run tests

## API Documentation

See [docs/api-contracts.md](docs/api-contracts.md) for complete API documentation.

## License

MIT
