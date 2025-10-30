"""
Simple tools for sustainability analysis
"""
import os
import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from bson import ObjectId
from urllib.parse import urlparse
import logging
import json

logger = logging.getLogger(__name__)


def convert_objectid_to_string(document):
    """Convert ObjectId fields to strings for JSON serialization"""
    if document is None:
        return None
    
    if isinstance(document, dict):
        result = {}
        for key, value in document.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, dict):
                result[key] = convert_objectid_to_string(value)
            elif isinstance(value, list):
                result[key] = [convert_objectid_to_string(item) if isinstance(item, dict) else str(item) if isinstance(item, ObjectId) else item for item in value]
            else:
                result[key] = value
        return result
    
    return document


def connect_to_mongodb():
    """Connect to MongoDB and return the selected database"""
    try:
        mongodb_uri = os.getenv("MONGODB_URI")
        mongodb_db = os.getenv("MONGODB_DATABASE")

        if not mongodb_uri or not mongodb_db:
            raise ValueError("MONGODB_URI or MONGODB_DATABASE not set in environment variables")

        client = MongoClient(mongodb_uri)
        db = client[mongodb_db]
        logger.info(f"Connected to MongoDB database: {mongodb_db}")
        return db
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        return None


def search_product_data(product_identifier: str):
    """Search for product in OpenFoodFacts collection"""
    try:
        db = connect_to_mongodb()
        if db is None:
            return None
            
        collection = db.food
        
        # Try different search methods
        product = None
        
        # 1. Try by ObjectId if it looks like one
        if len(product_identifier) == 24:
            try:
                product = collection.find_one({"_id": ObjectId(product_identifier)})
                if product:
                    logger.info(f"Found product by _id: {product.get('product_name', 'Unknown')}")
            except:
                pass  # Not a valid ObjectId
        
        # 2. Try by code if numeric
        if not product and product_identifier.isdigit():
            product = collection.find_one({"code": int(product_identifier)})
            if product:
                logger.info(f"Found product by code: {product.get('product_name', 'Unknown')}")
        
        # 3. Try by name or brand
        if not product:
            product = collection.find_one({
                "$or": [
                    {"product_name": {"$regex": product_identifier, "$options": "i"}},
                    {"brands": {"$regex": product_identifier, "$options": "i"}}
                ]
            })
            if product:
                logger.info(f"Found product by name/brand: {product.get('product_name', 'Unknown')}")
        
        if not product:
            logger.warning(f"No product found for: {product_identifier}")
        
        return convert_objectid_to_string(product)
    except Exception as e:
        logger.error(f"Product search failed: {e}")
        return None


def get_brand_mapping():
    """Map store brands to parent companies"""
    return {
        'walmart': 'Walmart',
        'great value': 'Walmart',
        "sam's choice": 'Walmart',
        'marketside': 'Walmart',
        'equate': 'Walmart',

        'kroger': 'Kroger',
        'simple truth': 'Kroger',
        'private selection': 'Kroger',

        'target': 'Target',
        'good & gather': 'Target',
        'market pantry': 'Target',

        'costco': 'Costco',
        'kirkland signature': 'Costco',

        'general mills': 'General Mills',
        'cheerios': 'General Mills',
        'nature valley': 'General Mills',
        'yoplait': 'General Mills',
        'lucky charms': 'General Mills',
        'pillsbury': 'General Mills',
        'haagen-dazs': 'General Mills',
        'betty crocker': 'General Mills',
        'old el paso': 'General Mills',
        'totino': 'General Mills',
        'trix': 'General Mills',
        'cocoa puffs': 'General Mills',
        'cinnamon toast crunch': 'General Mills',
        'fiber one': 'General Mills',
        'wheaties': 'General Mills',

        'pepsi': 'PepsiCo',
        'pepsico': 'PepsiCo',
        'frito-lay': 'PepsiCo',
        "lay's": 'PepsiCo',
        'lays': 'PepsiCo',
        'doritos': 'PepsiCo',
        'mountain dew': 'PepsiCo',
        'gatorade': 'PepsiCo',
        'tropicana': 'PepsiCo',
        'quaker': 'PepsiCo',
        'tostitos': 'PepsiCo',
        'cheetos': 'PepsiCo',
        'ruffles': 'PepsiCo',

        'coca-cola': 'Coca-Cola',
        'coke': 'Coca-Cola',
        'sprite': 'Coca-Cola',
        'fanta': 'Coca-Cola',
        'dasani': 'Coca-Cola',
        'minute maid': 'Coca-Cola',
        'powerade': 'Coca-Cola',
        'vitaminwater': 'Coca-Cola',

        'nestle': 'Nestlé',
        'nescafe': 'Nestlé',
        'kit kat': 'Nestlé',
        'pure life': 'Nestlé',
        'gerber': 'Nestlé',
        'stouffer': 'Nestlé',
        'digiorno': 'Nestlé',
        'hot pockets': 'Nestlé',
        'lean cuisine': 'Nestlé',
        'butterfinger': 'Nestlé',
        'crunch': 'Nestlé',

        'kelloggs': "Kellogg's",
        "kellogg's": "Kellogg's",
        'pringles': "Kellogg's",
        'cheez-it': "Kellogg's",
        'frosted flakes': "Kellogg's",
        'special k': "Kellogg's",
        'pop-tarts': "Kellogg's",
        'rice krispies': "Kellogg's",
        'eggo': "Kellogg's",
        'nutri-grain': "Kellogg's",

        'mars': 'Mars',
        "m&m's": 'Mars',
        "m&m": 'Mars',
        'snickers': 'Mars',
        'twix': 'Mars',
        'milky way': 'Mars',
        'skittles': 'Mars',
        'starburst': 'Mars',

        'oreo': 'Mondelez',
        'cadbury': 'Mondelez',
        'ritz': 'Mondelez',
        'trident': 'Mondelez',
        'chips ahoy': 'Mondelez',
        'wheat thins': 'Mondelez',
        'triscuit': 'Mondelez',

        'kraft': 'Kraft Heinz',
        'heinz': 'Kraft Heinz',
        'oscar mayer': 'Kraft Heinz',
        'philadelphia': 'Kraft Heinz',
        'velveeta': 'Kraft Heinz',
        'capri sun': 'Kraft Heinz',
        'jell-o': 'Kraft Heinz',
        'maxwell house': 'Kraft Heinz',
        'planters': 'Kraft Heinz',
        'lunchables': 'Kraft Heinz',
        'kool-aid': 'Kraft Heinz',

        'campbell': 'Campbell',
        "campbell's": 'Campbell',
        'pepperidge farm': 'Campbell',
        'goldfish': 'Campbell',
        'v8': 'Campbell',
        'prego': 'Campbell',
        'swanson': 'Campbell',

        'mccormick': 'McCormick',
        'french': 'McCormick',
        "french's": 'McCormick',
        'old bay': 'McCormick',
        'lawry': 'McCormick',
        "lawry's": 'McCormick',
        'casero': 'McCormick',

        'hershey': 'Hershey',
        "hershey's": 'Hershey',
        'reese': 'Hershey',
        "reese's": 'Hershey',
        'kisses': 'Hershey',
        'jolly rancher': 'Hershey',
        'ice breakers': 'Hershey',

        'conagra': 'ConAgra',
        'hunt': 'ConAgra',
        "hunt's": 'ConAgra',
        'reddi-wip': 'ConAgra',
        'slim jim': 'ConAgra',
        'healthy choice': 'ConAgra',
        'marie callender': 'ConAgra',
        "marie callender's": 'ConAgra',
        'orville redenbacher': 'ConAgra',
        'swiss miss': 'ConAgra',
        'vlasic': 'ConAgra',

        'hormel': 'Hormel',
        'spam': 'Hormel',
        'skippy': 'Hormel',
        'jennie-o': 'Hormel',
        'applegate': 'Hormel',

        'tyson': 'Tyson',
        'jimmy dean': 'Tyson',
        'hillshire farm': 'Tyson',
        'ball park': 'Tyson'
    }


def match_brand_to_company(brand_name: str):
    """Match a brand to its parent company using brand mapping"""
    if not brand_name:
        return brand_name
    
    brand_lower = brand_name.lower().strip()
    brand_mapping = get_brand_mapping()
    
    # Direct match
    if brand_lower in brand_mapping:
        matched_company = brand_mapping[brand_lower]
        logger.info(f"Mapped brand '{brand_name}' to company '{matched_company}'")
        return matched_company
    
    # Partial match - check if any mapping key is contained in the brand
    for brand_key, company in brand_mapping.items():
        if brand_key in brand_lower or brand_lower in brand_key:
            logger.info(f"Partial match: '{brand_name}' mapped to '{company}'")
            return company
    
    # No mapping found, return original
    logger.info(f"No mapping found for brand '{brand_name}', using as-is")
    return brand_name


def search_company_data(company_name: str):
    """Search for company ESG data with brand mapping"""
    try:
        db = connect_to_mongodb()
        if db is None:
            return None
            
        collection = db.esg_scores
        
        # First try with the mapped company name
        mapped_company = match_brand_to_company(company_name)
        
        # Search strategies in order of preference
        search_strategies = [
            # 1. Try exact ticker match (most reliable)
            {"ticker": {"$regex": f"^{mapped_company}$", "$options": "i"}},
            # 2. Try company name match
            {"name": {"$regex": mapped_company, "$options": "i"}},
            # 3. Try original brand name if mapping didn't work
            {"name": {"$regex": company_name, "$options": "i"}} if mapped_company != company_name else None
        ]
        
        for strategy in search_strategies:
            if strategy is None:
                continue
                
            company = collection.find_one(strategy)
            if company:
                search_type = "ticker" if "ticker" in strategy else "name"
                logger.info(f"Found company by {search_type}: {company.get('name', 'Unknown')} ({company.get('ticker', 'N/A')})")
                return convert_objectid_to_string(company)
        
        logger.warning(f"No ESG data found for: {company_name} (mapped to: {mapped_company})")
        return None
        
    except Exception as e:
        logger.error(f"Company search failed: {e}")
        return None



def search_news(company_name: str, days: int = 365, company_data: dict = None):
    """ESG news search using Tavily API - optimized for relevant results"""
    try:
        tavily_api_key = os.getenv("TAVILY_API_KEY")
        if not tavily_api_key:
            logger.error("TAVILY_API_KEY not found in environment variables")
            return []
        
        logger.info(f"Searching Tavily for ESG ethical news about: {company_name}")
        
        # Get the mapped company name for better search results
        mapped_company = match_brand_to_company(company_name)
        search_company = mapped_company if mapped_company != company_name else company_name
        
        # Broad query to capture ALL ESG-related news (not just reports)
        # This should catch: scandals, initiatives, lawsuits, controversies, commitments, violations, etc.
        esg_query = f'{search_company} (sustainability OR environmental OR climate OR diversity OR labor OR ethics OR governance OR scandal OR lawsuit)'
        
        logger.info(f"ESG news search for: '{search_company}' (mapped from '{company_name}')")
        logger.info(f"🔍 Executing Tavily query: {esg_query}")
        
        # Tavily API endpoint
        tavily_url = "https://api.tavily.com/search"

        # Focus on ESG-specific sources and quality business news
        ALLOWLIST = [
            # ESG-focused publications (highest priority)
            "esgtoday.com", "greenbiz.com", "environmentalleader.com",
            "sustainablebrands.com", "triplepundit.com", "csrwire.com",
            "justmeans.com", "corporateknights.com",
            # Quality business news with ESG coverage
            "reuters.com", "bloomberg.com", "ft.com", "wsj.com",
            "theguardian.com", "bbc.com", "apnews.com",
            # Add back major outlets that DO cover ESG
            "cnbc.com", "forbes.com", "businessinsider.com",
        ]

        BLOCKLIST = [
            # Press release wires
            "prnewswire.com", "globenewswire.com", "businesswire.com",
            "markets.ft.com", "yahoo.com", "seekingalpha.com", "benzinga.com",
            "medium.com", "substack.com", "wordpress.com",
            # Generic aggregators
            "worldoil.com", "cosmeticsbusiness.com", "thestreet.com",
            "marketwatch.com", "facilitiesmanagement-now.com",
            # Company sites (pure marketing)
            "walmart.com", "corporate.walmart.com", "walmartsustainabilityhub.com",
        ]
        
        # More targeted Tavily parameters
        payload = {
            "api_key": tavily_api_key,
            "query": esg_query,
            "search_depth": "advanced",  # Use advanced for better ESG filtering
            "include_answer": False,
            "include_raw_content": False,
            "max_results": 15,  # Get more results to filter
            "include_domains": ALLOWLIST,
            "exclude_domains": BLOCKLIST,
            "include_images": False,
            "topic": "news"
        }
        
        # Add date filtering for recent news
        from datetime import datetime, timedelta
        if days < 365:
            payload["days"] = days
        else:
            payload["days"] = 365  
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        response = requests.post(tavily_url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            
            logger.info(f"📊 Total results from Tavily: {len(results)}")
            
            all_urls = []
            source_counts = {}
            
            # ESG keywords for relevance filtering
            esg_filter_keywords = [
                'sustainability', 'environmental', 'climate', 'carbon', 'esg',
                'diversity', 'inclusion', 'dei', 'labor', 'ethics', 'governance',
                'renewable', 'emissions', 'social responsibility', 'green',
                'ethical', 'supply chain', 'human rights', 'workplace'
            ]
            
            # Process each result from Tavily
            for result in results:
                url = result.get('url', '')
                title = result.get('title', 'No title')
                title_lower = title.lower()
                content_snippet = result.get('content', '').lower()
                
                # CRITICAL: Article must mention the company in title or snippet
                company_mentioned = any(
                    comp.lower() in title_lower or comp.lower() in content_snippet
                    for comp in [search_company, mapped_company, company_name]
                )
                
                # Filter: Must have company AND ESG terms
                has_esg_term = any(keyword in title_lower or keyword in content_snippet 
                                  for keyword in esg_filter_keywords)
                
                if url and url not in all_urls and company_mentioned and has_esg_term:
                    source = urlparse(url).netloc
                    source_counts[source] = source_counts.get(source, 0) + 1
                    all_urls.append(url)
                    logger.info(f"✅ Found relevant ESG article: {title[:80]}...")
                elif not company_mentioned:
                    logger.debug(f"⊘ Filtered out (company not mentioned): {title[:60]}...")
                elif not has_esg_term:
                    logger.debug(f"⊘ Filtered out (no ESG terms): {title[:60]}...")
            
            total_articles = len(all_urls)
            logger.info(f"📰 Found {total_articles} ESG-relevant articles from quality sources")
            
            # Show source diversity
            if source_counts:
                top_sources = sorted(source_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                source_summary = ', '.join([f"{src}({cnt})" for src, cnt in top_sources])
                logger.info(f"📊 Source diversity: {source_summary}")
            
            # Show sample articles found
            if all_urls:
                logger.info(f"✅ Sample ESG articles found:")
                for i, url in enumerate(all_urls[:3], 1):
                    logger.info(f"   {i}. {urlparse(url).netloc}")
            
            return all_urls
        else:
            logger.error(f"❌ Tavily API error: {response.status_code} - {response.text}")
            return []
        
    except Exception as e:
        logger.error(f"Tavily news search failed: {e}")
        return []


def scrape_article(url: str):
    """Scrape article content using requests and BeautifulSoup"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove unwanted elements
        for element in soup(["script", "style", "nav", "footer", "aside"]):
            element.decompose()
        
        # Get title
        title = ""
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text().strip()
        
        # Get content
        content = ""
        for selector in ['article', '.article-content', '.post-content', 'main']:
            element = soup.select_one(selector)
            if element:
                content = element.get_text()
                break
        
        if not content:
            content = soup.get_text()
        
        # Clean content
        lines = (line.strip() for line in content.splitlines())
        clean_content = '\n'.join(line for line in lines if line)
        
        return {
            "url": url,
            "title": title,
            "content": clean_content[:1500],  # Limit length
            "source": urlparse(url).netloc
        }
        
    except Exception as e:
        logger.error(f"Failed to scrape {url}: {e}")
        return {
            "url": url,
            "title": "",
            "content": "",
            "source": urlparse(url).netloc if url else ""
        }


def generate_consumer_sustainability_summary(content: str, title: str, company_name: str):
    """Generate consumer-focused sustainability summary using OpenAI GPT-4o-mini"""
    try:
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.warning("No OpenAI API key found, skipping AI summary")
            return None
        
        # Truncate content to manage API costs
        max_content_length = 2000
        truncated_content = content[:max_content_length]
        if len(content) > max_content_length:
            truncated_content += "... [truncated]"
        
        # Consumer-focused ESG prompt (broader than just sustainability)
        prompt = f"""You are an ESG expert helping consumers make informed choices about companies they support.

            Analyze this news article about {company_name} and extract ESG (Environmental, Social, Governance) information that would be relevant and useful for consumers who care about corporate responsibility.

            Focus on ANY of these ESG areas:
            - ENVIRONMENTAL: carbon footprint, waste, packaging, renewable energy, climate commitments
            - SOCIAL: labor practices, diversity & inclusion (DEI), racial equity, worker rights, community impact, supply chain ethics
            - GOVERNANCE: ethics violations, transparency, lawsuits, regulatory issues, leadership accountability

            This includes POSITIVE and NEGATIVE ESG developments - consumers want to know about both achievements AND controversies.
s
            Output ONLY the most important consumer-relevant ESG insights in 1-2 clear, concise sentences. If there's no meaningful ESG content for consumers, respond with "NO_ESG_CONTENT".

            Article Title: {title}
            Article Content: {truncated_content}

        Consumer ESG summary:"""

        headers = {
            "Authorization": f"Bearer {openai_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "gpt-4o-mini",  # Use working model
            "messages": [
                {"role": "system", "content": "You are an ESG expert focused on consumer-relevant information about Environmental, Social, and Governance issues. Be concise and factual."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 150, 
            "temperature": 0.3,  # Lower temperature for more factual responses
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['choices'][0]['message']['content'].strip()
            
            # Check if AI found relevant ESG content
            if ai_response == "NO_ESG_CONTENT" or len(ai_response) < 20:
                return None
            
            return ai_response
        else:
            logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"AI summary generation failed: {e}")
        return None



def analyze_sentiment_simple(content: str, company_name: str):
    """Simple sentiment analysis with strict relevance filtering"""
    content_lower = content.lower()
    title_and_content = content_lower  # Combine title and content for analysis
    
    # Get both the original company name and mapped company for relevance checking
    mapped_company = match_brand_to_company(company_name)
    
    # Define specific company identifiers that must be present
    company_identifiers = []
    
    if mapped_company.lower() == "walmart":
        company_identifiers = ["walmart", "wal-mart", "wal mart"]
    elif mapped_company.lower() == "coca-cola":
        company_identifiers = ["coca-cola", "coca cola", "coke"]
    elif mapped_company.lower() == "amazon":
        company_identifiers = ["amazon"]
    elif mapped_company.lower() == "target":
        company_identifiers = ["target corp", "target corporation", "target stores"]
    else:
        # For other companies, use the mapped company name
        company_identifiers = [mapped_company.lower()]
    
    # Check if the specific company is actually mentioned (must be in title OR prominently in content)
    title_lower = (title_and_content.split('\n')[0] if '\n' in title_and_content else title_and_content[:200]).lower()
    
    # Company must be mentioned in title OR multiple times in content
    company_in_title = any(identifier in title_lower for identifier in company_identifiers)
    company_mentions_in_content = sum(title_and_content.count(identifier) for identifier in company_identifiers)
    
    if not company_in_title and company_mentions_in_content < 2:
        return {"sentiment_score": 0.0, "relevance_score": 0.0}
    
    # ESG ethical researcher focus - Environmental, Social, Governance keywords
    esg_keywords = [
        # Environmental
        'climate', 'carbon', 'emissions', 'renewable', 'solar', 'wind', 
        'environmental', 'pollution', 'waste', 'recycling', 'sustainability',
        'green', 'eco-friendly', 'biodiversity', 'deforestation',
        
        # Social - Enhanced DEI focus
        'labor', 'workers', 'employee', 'diversity', 'inclusion', 'workplace',
        'human rights', 'community', 'social responsibility', 'safety',
        'discrimination', 'harassment', 'fair trade', 'supply chain ethics',
        # DEI-specific keywords
        'dei', 'diversity equity inclusion', 'racial equity', 'racial justice',
        'diversity rollback', 'dei rollback', 'diversity program', 'inclusion program',
        'diversity training', 'equity initiatives', 'diversity policy', 'inclusion policy',
        'workplace equity', 'diversity backlash', 'diversity controversy',
        'racial bias', 'systemic racism', 'equal opportunity', 'affirmative action',
        'diversity hiring', 'inclusive culture', 'equity push', 'diversity commitment',
        
        # Governance
        'governance', 'ethics', 'transparency', 'accountability', 'corruption',
        'scandal', 'investigation', 'compliance', 'board', 'executive',
        'shareholder', 'fraud', 'bribery', 'whistleblower',
        
        # General ESG
        'esg', 'ethical', 'responsible', 'sustainable business'
    ]
    
    # Count ESG keyword mentions
    esg_mentions = sum(1 for keyword in esg_keywords if keyword in title_and_content)
    
    # Require at least 1 ESG mention for relevance
    if esg_mentions < 1:
        return {"sentiment_score": 0.0, "relevance_score": 0.0}
    
    # Additional relevance check - look for company + sustainability in same sentence/paragraph
    sentences = title_and_content.split('.')
    relevant_sentences = 0
    
    for sentence in sentences:
        sentence = sentence.strip()
        has_company = any(identifier in sentence for identifier in company_identifiers)
        has_esg = any(keyword in sentence for keyword in esg_keywords)
        
        if has_company and has_esg:
            relevant_sentences += 1
    
    # If no sentences contain both company and sustainability, mark as irrelevant
    if relevant_sentences == 0:
        return {"sentiment_score": 0.0, "relevance_score": 0.0}
    
    # Simple keyword-based sentiment
    positive_words = [
        'sustainable', 'renewable', 'green', 'clean', 'efficient',
        'reduce', 'improvement', 'initiative', 'commitment', 'achievement',
        'progress', 'innovation', 'leadership', 'responsible', 'invest',
        'goal', 'target', 'pledge', 'carbon neutral',
        # DEI positive words
        'diversity initiative', 'inclusion program', 'equity commitment',
        'diversity training', 'inclusive culture', 'equal opportunity',
        'diversity hiring', 'racial justice', 'equity push', 'diversity efforts'
    ]
    
    negative_words = [
        'pollution', 'violation', 'fine', 'lawsuit', 'greenwashing',
        'harmful', 'toxic', 'waste', 'criticism', 'scandal',
        'failure', 'damage', 'controversy', 'accused', 'penalty',
        # DEI negative words
        'rollback', 'dei rollback', 'diversity rollback', 'discrimination',
        'bias', 'harassment', 'diversity cuts', 'equity removed',
        'diversity controversy', 'diversity backlash', 'inclusion ended'
    ]
    
    positive_count = sum(1 for word in positive_words if word in title_and_content)
    negative_count = sum(1 for word in negative_words if word in title_and_content)
    
    # Calculate sentiment score
    if positive_count + negative_count == 0:
        sentiment_score = 0.0
    else:
        sentiment_score = (positive_count - negative_count) / (positive_count + negative_count)
    
    # Calculate relevance score based on relevant sentences and ESG mentions
    relevance_score = min(1.0, (relevant_sentences * 0.3) + (esg_mentions * 0.1))
    
    return {
        "sentiment_score": sentiment_score,
        "relevance_score": relevance_score
    }


def filter_and_deduplicate_summaries(summaries: list, company_name: str):
    """Combined relevance filtering and deduplication using LLM"""
    if len(summaries) <= 1:
        return summaries
    
    try:
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.warning("No OpenAI API key found, skipping filtering and deduplication")
            return summaries
        
        # Create prompt for combined filtering and deduplication
        summaries_text = ""
        for i, summary in enumerate(summaries):
            sources = summary.get('sources', [])
            sources_str = f" [Source: {sources[0] if sources else 'none'}]" if sources else ""
            summaries_text += f"{i+1}. [{summary['tag']}]{sources_str} {summary['text']}\n\n"
        
        logger.info(f"📝 Sending {len(summaries)} summaries to AI for deduplication:")
        logger.info(f"Summaries preview:\n{summaries_text[:800]}")
        
        prompt = f"""You are analyzing ESG summaries about {company_name}. 

                IMPORTANT: These summaries have ALREADY been verified as relevant to {company_name}. Do NOT filter them out for relevance.

                Your ONLY job: Merge summaries that discuss the SAME ESG topic.

                Current summaries:
                {summaries_text}

                MERGING RULES:
                1. If multiple summaries are about the SAME topic (e.g., DEI, climate, labor), combine them into ONE summary
                2. When merging, include ALL key information from each summary
                3. Combine ALL source URLs
                4. Use the most descriptive tag

                EXAMPLES:
                - Input: 5 summaries about DEI initiatives → Output: 1 merged DEI summary with all 5 sources
                - Input: 2 summaries about climate + 1 about labor → Output: 1 climate summary (2 sources) + 1 labor summary (1 source)

                CRITICAL: All these summaries are about {company_name} and are relevant. Keep them all, just merge similar topics.

                Return JSON array only:
                [
                {{
                    "text": "merged summary with all key points from similar summaries",
                    "tag": "diversity & inclusion",
                    "sources": ["url1", "url2", "url3"]
                }}
                ]"""

        headers = {
            "Authorization": f"Bearer {openai_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are an expert ESG analyst. Filter for company-specific relevance and deduplicate content. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            "max_completion_tokens": 1200,
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['choices'][0]['message']['content'].strip()
            
            logger.info(f"🤖 Raw AI response (first 800 chars):\n{ai_response[:800]}")
            logger.info(f"🤖 Full response length: {len(ai_response)} chars")
            
            # Clean up the response - sometimes AI adds extra text
            if ai_response.startswith('```json'):
                ai_response = ai_response.replace('```json', '').replace('```', '').strip()
            elif ai_response.startswith('```'):
                ai_response = ai_response.replace('```', '').strip()
            
            # Find JSON array in the response
            start_idx = ai_response.find('[')
            end_idx = ai_response.rfind(']') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_part = ai_response[start_idx:end_idx]
                
                try:
                    # Parse the JSON response
                    filtered_deduplicated = json.loads(json_part)
                    
                    # Validate the response
                    if isinstance(filtered_deduplicated, list):
                        logger.info(f"📊 AI returned {len(filtered_deduplicated)} raw items")
                        logger.info(f"📊 Raw AI response: {json.dumps(filtered_deduplicated, indent=2)[:500]}")
                        
                        # Remove relevance_reason from final output (internal use only)
                        clean_summaries = []
                        for i, summary in enumerate(filtered_deduplicated):
                            logger.info(f"   Item {i+1}: type={type(summary)}")
                            logger.info(f"   Item {i+1} content: {summary}")
                            
                            # More flexible validation
                            if isinstance(summary, dict):
                                text = summary.get("text", "").strip()
                                tag = summary.get("tag", "general").strip()
                                sources = summary.get("sources", [])
                                
                                logger.info(f"   Item {i+1} text length: {len(text)}")
                                logger.info(f"   Item {i+1} tag: '{tag}'")
                                logger.info(f"   Item {i+1} sources: {len(sources)}")
                                
                                # Accept if there's ANY text content
                                if text and len(text) > 10:
                                    clean_summary = {
                                        "text": text,
                                        "tag": tag if tag else "general",
                                        "sources": sources if isinstance(sources, list) else []
                                    }
                                    clean_summaries.append(clean_summary)
                                    logger.info(f"   ✅ Added item {i+1}: {text[:100]}...")
                                else:
                                    logger.warning(f"   ❌ Skipped item {i+1}: Text too short or missing (len={len(text)})")
                            else:
                                logger.warning(f"   ❌ Skipped item {i+1}: Not a dict, got {type(summary)}")
                        
                        logger.info(f"🔄 Filtered and deduplicated {len(summaries)} summaries to {len(clean_summaries)}")
                        
                        # Fallback: if AI filtered out everything, keep original summaries
                        if len(clean_summaries) == 0 and len(summaries) > 0:
                            logger.warning("⚠️ AI filtered out all summaries, keeping originals")
                            return summaries
                        
                        return clean_summaries
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse filtering response: {e}")
                    logger.error(f"Raw AI response: {ai_response[:200]}...")
                    return summaries
            else:
                logger.error("No valid JSON array found in AI response")
                logger.error(f"Raw AI response: {ai_response[:200]}...")
                return summaries
        
        else:
            logger.error(f"Filtering API error: {response.status_code}")
            return summaries
            
    except Exception as e:
        logger.error(f"Filtering and deduplication failed: {e}")
        return summaries


