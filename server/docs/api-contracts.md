# API Contracts

## Base URL
```
http://localhost:3000
```

## Standard Error Response
All error responses follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Optional additional details"
  }
}
```

## Endpoints

### 1. Health Check

**GET** `/health`

Check server health and status.

#### Response
**200 OK**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

---

### 2. Product Lookup

**GET** `/v1/lookup`

Look up product information using barcode or text search.

#### Query Parameters
- `upc` (string, optional): UPC barcode
- `ean` (string, optional): EAN barcode  
- `gtin` (string, optional): GTIN barcode
- `q` (string, optional): Text search query

**Note**: At least one parameter must be provided.

#### Success Response
**200 OK**
```json
{
  "id": "1234567890123",
  "barcode": {
    "type": "upc",
    "value": "1234567890123"
  },
  "name": "Product Name",
  "brand": "Brand Name",
  "brandAliases": ["Alternative Brand Name"],
  "category": "Food Category",
  "imageUrl": "https://example.com/image.jpg",
  "company": {
    "resolution": "resolved|ambiguous|unresolved",
    "companyId": "company_123",
    "candidates": [
      {
        "companyId": "company_456",
        "confidence": 0.85,
        "name": "Company Name"
      }
    ]
  },
  "source": {
    "name": "OpenFoodFacts",
    "recordId": "1234567890123",
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses
**400 Bad Request**
```json
{
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "Missing required parameters. Provide either upc, ean, gtin, or q"
  }
}
```

**404 Not Found**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found for barcode: 1234567890123"
  }
}
```

**409 Conflict**
```json
{
  "error": {
    "code": "AMBIGUOUS",
    "message": "Multiple companies found for brand. Please specify company.",
    "details": {
      "candidates": [
        {
          "companyId": "company_123",
          "confidence": 0.85,
          "name": "Company A"
        },
        {
          "companyId": "company_456", 
          "confidence": 0.78,
          "name": "Company B"
        }
      ]
    }
  }
}
```

**500 Internal Server Error**
```json
{
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "message": "Failed to fetch product from OpenFoodFacts",
    "details": "Connection timeout"
  }
}
```

---

### 3. Company Information

**GET** `/v1/company/:id` or **GET** `/v1/company`

Get company information by MongoDB ID, ticker symbol, or search query.

#### Path Parameters (for `/v1/company/:id`)
- `id` (string, required): MongoDB ObjectId

#### Query Parameters (for `/v1/company`)
- `ticker` (string, optional): Stock ticker symbol (case-insensitive exact match)
- `q` (string, optional): Search query for company name or aliases (case-insensitive regex)

**Note**: For `/v1/company`, at least one query parameter must be provided.

#### Success Response
**200 OK** (Single Company)
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Walt Disney Co",
  "aliases": ["Walt Disney Co", "Disney"],
  "country": null,
  "tickers": ["DIS"],
  "domains": ["thewaltdisneycompany.com"],
  "esgSources": [
    {
      "source": "kaggle-public-company-esg",
      "asOf": "2022-04-19T00:00:00.000Z",
      "raw": {
        "E": 510,
        "S": 316,
        "G": 321,
        "scale": "0-100"
      }
    }
  ],
  "meta": {
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**200 OK** (Search Results)
```json
{
  "matches": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Nestlé S.A.",
      "aliases": ["Nestlé", "Nestle"],
      "country": "Switzerland",
      "tickers": ["NESN"],
      "domains": ["nestle.com"],
      "esgSources": [...],
      "meta": {...}
    }
  ]
}
```

#### Error Responses
**400 Bad Request**
```json
{
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "Missing required parameter. Provide either id, ticker, or q"
  }
}
```

**404 Not Found**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Company not found with ticker: MSFT"
  }
}
```

**500 Internal Server Error**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal error occurred"
  }
}
```

---

### 4. Company Score

**GET** `/v1/score/:companyId`

Get ethical score for a company based on ESG data.

#### Path Parameters
- `companyId` (string, required): MongoDB ObjectId of the company

#### Scoring Methodology

The overall score is calculated using weighted ESG factors:
- **Default weights**: Environment (40%), Labor/Social (40%), Governance (20%)
- **Weight normalization**: If any E/S/G score is null, weights are redistributed equally among available factors
- **Formula**: `overall = round(E×wE + S×wS + G×wG)`

**Confidence calculation** (base 0.80):
- +0.05 if ESG data is ≤24 months old
- +0.05 if all E/S/G scores are available (not null)
- Maximum confidence: 0.95

#### Success Response
**200 OK**
```json
{
  "companyId": "507f1f77bcf86cd799439011",
  "overall": 85,
  "breakdown": {
    "environment": 510,
    "labor": 316,
    "governance": 321
  },
  "methodology": {
    "version": "1.0.0",
    "weights": {
      "environment": 0.4,
      "labor": 0.4,
      "governance": 0.2
    }
  },
  "confidence": 0.90,
  "asOf": "2022-04-19T00:00:00.000Z",
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

#### Error Responses
**404 Not Found** (Company not found)
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Company not found with ID: 507f1f77bcf86cd799439011"
  }
}
```

**404 Not Found** (No ESG data)
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No ESG data found for company: 507f1f77bcf86cd799439011"
  }
}
```

**500 Internal Server Error**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal error occurred"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_ARGUMENT` | Missing or invalid request parameters |
| `NOT_FOUND` | Requested resource not found |
| `AMBIGUOUS` | Multiple matches found, requires disambiguation |
| `EXTERNAL_SERVICE_ERROR` | Error from external service (OpenFoodFacts) |
| `INTERNAL_ERROR` | Internal server error |

## Rate Limiting
Currently no rate limiting is implemented, but it should be considered for production use.

## Authentication
Currently no authentication is required, but it should be considered for production use.

## Caching
- Product lookups are cached for 7 days
- Cache is stored in MongoDB with automatic TTL cleanup
- Cache keys are based on the lookup parameter (barcode or search query)
