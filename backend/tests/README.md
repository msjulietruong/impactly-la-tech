# Backend Tests

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test
```

## What Gets Tested

- ✅ Health check endpoint
- ✅ Product lookup by barcode
- ✅ Company lookup and ESG scores
- ✅ **Product search returns multiple products** (not just "Sidi Ali")
- ✅ **Products include ESG data with overall score**
- ✅ **ESG and alternatives endpoints work correctly**

## Test Files

- `api.spec.js` - All API endpoint tests (Jest/Supertest)

## Prerequisites

- MongoDB running and accessible
- `.env` file with `MONGODB_URI` configured
- Server can be started with `npm run dev` (tests use the app directly)

