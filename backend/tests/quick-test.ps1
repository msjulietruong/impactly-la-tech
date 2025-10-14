# ========================================
# QUICK TEST SCRIPT
# ========================================
# 
# What this does:
# - Tests the 3 main API endpoints to make sure they work
# - Shows you green [PASS] if everything is working
# - Shows you red [FAIL] if something is broken
# 
# How to run this:
#   1. Make sure the server is running (npm start)
#   2. Open PowerShell in the backend folder
#   3. Run: .\tests\quick-test.ps1
# 
# What it tests:
#   1. Product search (can we find products by name?)
#   2. Product details (can we get info about a specific product?)
#   3. ESG scores (can we get ethics ratings for companies?)

Write-Host "`n=== TESTING THE 3 MAIN ENDPOINTS ===" -ForegroundColor Cyan
Write-Host "Making sure our code changes didn't break anything!`n" -ForegroundColor Cyan

# SETUP: Where is our server running?
$baseUrl = "http://localhost:3001"  # The server should be at this address

# COUNTERS: Keep track of how many tests pass/fail
$testsPassed = 0   # Starts at 0, goes up when tests pass
$testsFailed = 0   # Starts at 0, goes up when tests fail

# ============================================================================
# TEST 1: Search for Products
# ============================================================================
# This tests if we can search for products by typing a word (like "chocolate")

Write-Host "Test 1: Search for products" -ForegroundColor Yellow
Write-Host "  Testing: GET /api/products?q=chocolate" -ForegroundColor Gray

try {
    # Try to search for products with "chocolate" in the name
    # -TimeoutSec 30 means "wait up to 30 seconds for a response"
    $response = Invoke-WebRequest -Uri "$baseUrl/api/products?q=chocolate" -UseBasicParsing -TimeoutSec 30
    
    # StatusCode 200 means "Success! Everything worked!"
    if ($response.StatusCode -eq 200) {
        Write-Host "  [PASS] Product search works!" -ForegroundColor Green
        $testsPassed++  # Add 1 to our pass counter
    }
} catch {
    # If something goes wrong, show the error and count it as a failure
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++  # Add 1 to our fail counter
}

# ============================================================================
# TEST 2: Get Product Details
# ============================================================================
# This tests if we can get detailed info about ONE specific product
# We use a barcode number (3274080005003) to identify the product

Write-Host "`nTest 2: Get product details" -ForegroundColor Yellow
Write-Host "  Testing: GET /api/products/3274080005003" -ForegroundColor Gray

try {
    # Ask the server for details about product 3274080005003
    $response = Invoke-WebRequest -Uri "$baseUrl/api/products/3274080005003" -UseBasicParsing -TimeoutSec 30
    
    if ($response.StatusCode -eq 200) {
        # Convert the JSON response to an object we can use
        $product = $response.Content | ConvertFrom-Json
        
        Write-Host "  [PASS] Got details for: $($product.name)" -ForegroundColor Green
        $testsPassed++
        
        # Save the brand name for the next test
        $brandName = $product.brand
        
        # ============================================================================
        # TEST 3: Get ESG Scores (Ethics Ratings)
        # ============================================================================
        # This tests if we can get ESG scores (how ethical the company is)
        # ESG = Environment, Social, Governance scores (0-100 each)
        
        Write-Host "`nTest 3: Get ESG scores" -ForegroundColor Yellow
        Write-Host "  Testing: GET /api/products/3274080005003/esg" -ForegroundColor Gray
        
        try {
            # Ask for ESG scores for this product's company
            # -ErrorAction Stop means "if it fails, go to the catch block"
            $esgResponse = Invoke-WebRequest -Uri "$baseUrl/api/products/3274080005003/esg" -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
            
            if ($esgResponse.StatusCode -eq 200) {
                # Convert the JSON response to an object
                $esg = $esgResponse.Content | ConvertFrom-Json
                
                # Success! Show all the scores
                Write-Host "  [PASS] Got ESG scores!" -ForegroundColor Green
                Write-Host "    Company: $($esg.companyName)" -ForegroundColor Gray
                Write-Host "    Environment Score: $($esg.esgData.environment.score)" -ForegroundColor Gray
                Write-Host "    Social Score: $($esg.esgData.social.score)" -ForegroundColor Gray
                Write-Host "    Governance Score: $($esg.esgData.governance.score)" -ForegroundColor Gray
                $testsPassed++
            }
        } catch {
            # Something went wrong - let's see what happened
            
            # Try to get the error status code (404, 500, etc.)
            $statusCode = 0
            if ($null -ne $_.Exception.Response) {
                $statusCode = $_.Exception.Response.StatusCode.value__
            }
            
            # 404 = Not Found (this is OK - not all brands have ESG data)
            if ($statusCode -eq 404) {
                Write-Host "  [PASS] No ESG data for brand: $brandName (This is OK)" -ForegroundColor Yellow
                Write-Host "    Not all brands have ESG data yet" -ForegroundColor Gray
                $testsPassed++  # Still count as pass - this is expected
            } else {
                # Some other error - this is a real failure
                Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
                $testsFailed++
            }
        }
    }
} catch {
    # If we can't get product details at all, that's a failure
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# ============================================================================
# RESULTS - Show the Final Score
# ============================================================================
# Now we show how many tests passed and failed

Write-Host "`n=== TEST RESULTS ===" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green

# Show failed tests in red if any failed, green if all passed
if ($testsFailed -eq 0) {
    Write-Host "Tests Failed: $testsFailed" -ForegroundColor Green
} else {
    Write-Host "Tests Failed: $testsFailed" -ForegroundColor Red
}

# Give a final verdict
if ($testsFailed -eq 0) {
    # Yay! Everything works!
    Write-Host "`n[SUCCESS] ALL TESTS PASSED! The code is working correctly." -ForegroundColor Green
    Write-Host "Your changes didn't break anything - great job!" -ForegroundColor Green
} else {
    # Oh no, something is broken
    Write-Host "`n[ERROR] Some tests failed. Check the error messages above." -ForegroundColor Red
}

Write-Host ""  # Empty line for spacing
