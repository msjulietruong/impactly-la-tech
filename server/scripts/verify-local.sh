#!/bin/bash

# Local verification script for ESG backend
set -e

echo "🔍 Verifying local setup..."

# Check if .env exists
if [ ! -f "./.env" ]; then
    echo "❌ Error: .env file not found"
    echo "   Please copy .env.example to .env and configure your settings"
    exit 1
fi

echo "✅ .env file found"

# Source .env to check required variables
set -a
source ./.env
set +a

# Check required environment variables
missing_vars=()

if [ -z "$MONGODB_URI" ]; then
    missing_vars+=("MONGODB_URI")
fi

if [ -z "$OFF_ENV" ]; then
    missing_vars+=("OFF_ENV")
fi

if [ -z "$OFF_USER_AGENT" ]; then
    missing_vars+=("OFF_USER_AGENT")
fi

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo "   Please check your .env file"
    exit 1
fi

echo "✅ Required environment variables present"

# Set defaults
PORT=${PORT:-3001}
TEST_TICKER=${TEST_TICKER:-MSFT}

echo "📦 Installing dependencies..."
npm ci

echo "🧪 Running verification (ingest + tests)..."
npm run verify

echo ""
echo "🎉 Verification successful!"
echo ""
echo "📡 Test your endpoints with these commands:"
echo ""
echo "curl http://localhost:$PORT/health"
echo "curl \"http://localhost:$PORT/v1/company?ticker=${TEST_TICKER}\""
echo "curl \"http://localhost:$PORT/v1/score/<PASTE_ID_FROM_PREVIOUS>\""
echo ""
echo "💡 Start the server with: npm run dev"
