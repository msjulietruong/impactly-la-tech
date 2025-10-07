#!/bin/sh

set -e

echo "Verifying local setup..."

if [ ! -f "$PWD/.env" ]; then
    echo "ERROR: '.env' file not found at '$PWD'."
    echo "  Please copy .env.example to .env and configure your settings."
    exit 1
fi

source "$PWD/.env"

echo "INFO: Scanning environment variables..."
missing_env="0"
if [ -z "$MONGODB_URI" ]; then
    echo "ERROR: Missing 'MONGODB_URI'."
    missing_env="1"
fi

if [ -z "$OFF_ENV" ]; then
    echo "ERROR: Missing 'OFF_ENV'."
    missing_env="1"
fi

if [ -z "$OFF_USER_AGENT" ]; then
    echo "ERROR: Missing 'OFF_USER_AGENT'."
    missing_env="1"
fi

[ "$missing_env" = "1" ] && echo "ERROR: Stopping execution." && exit 1

# Set defaults
PORT=${PORT:-3001}
TEST_TICKER=${TEST_TICKER:-MSFT}

echo "INFO: Installing dependencies..."
npm ci

echo "INFO: Running verification (ingest + tests)..."
npm run verify

echo ""
echo "Verification successful."
echo ""
echo "Test your endpoints with these commands:"
echo ""
echo "curl http://localhost:$PORT/health"
echo "curl \"http://localhost:$PORT/v1/company?ticker=${TEST_TICKER}\""
echo "curl \"http://localhost:$PORT/v1/score/<PASTE_ID_FROM_PREVIOUS>\""
echo ""
echo "💡 Start the server with: npm run dev"
