"""
Simple node functions for the sustainability analysis workflow
"""
import logging
import os
from datetime import datetime
from .tools import (
    search_product_data, search_company_data, search_news,
    scrape_article,
    generate_consumer_sustainability_summary, filter_and_deduplicate_summaries
)

logger = logging.getLogger(__name__)


def data_retrieval_node(state):
    """Retrieve product and company data from MongoDB"""
    logger.info(f"Retrieving data for: {state['product_identifier']}")
    
    try:
        # Search for product
        product_data = search_product_data(state["product_identifier"])
        
        # Extract company name
        company_name = None
        if product_data and product_data.get("brands"):
            company_name = product_data["brands"].split(',')[0].strip()
        
        # Search for company ESG data
        company_data = None
        if company_name:
            company_data = search_company_data(company_name)
        
        return {
            "product_data": product_data,
            "company_data": company_data,
            "company_name": company_name,
            "status": "data_retrieved"
        }
        
    except Exception as e:
        logger.error(f"Data retrieval failed: {e}")
        return {
            "errors": state.get("errors", []) + [f"Data retrieval error: {str(e)}"],
            "status": "failed"
        }


def news_search_node(state):
    """Search for sustainability news"""
    logger.info(f"Searching news for: {state.get('company_name')}")
    
    try:
        company_name = state.get("company_name")
        if not company_name:
            return {
                "news_urls": [],
                "errors": state.get("errors", []) + ["No company name for news search"],
                "status": "news_searched"
            }
        
        # Search for ESG ethical news from diverse sources
        company_data = state.get("company_data")
        news_urls = search_news(company_name, days=365, company_data=company_data)
        
        return {
            "news_urls": news_urls,
            "status": "news_searched"
        }
        
    except Exception as e:
        logger.error(f"News search failed: {e}")
        return {
            "news_urls": [],
            "errors": state.get("errors", []) + [f"News search error: {str(e)}"],
            "status": "failed"
        }


def content_analysis_node(state):
    """Analyze content from news articles using AI for consumer-focused sustainability insights"""
    logger.info("Analyzing article content with AI")
    
    try:
        news_urls = state.get("news_urls", [])
        company_name = state.get("company_name", "")
        
        # Handle case where news_urls might be None
        if news_urls is None:
            news_urls = []
            logger.warning("⚠️ news_urls was None, converting to empty list")
        
        logger.info(f"🔍 Content analysis received {len(news_urls)} URLs to process")
        for i, url in enumerate(news_urls[:3], 1):
            logger.info(f"   {i}. {url}")
        
        if not news_urls:
            logger.warning("❌ No news URLs provided to content analysis")
            return {
                "articles": [],
                "status": "content_analyzed"
            }
        
        articles = []
        
        # Scrape and analyze each article with AI-powered analysis
        logger.info(f"Using AI-powered analysis for {len(news_urls)} articles")
        
        for i, url in enumerate(news_urls):
            logger.info(f"📄 Processing article {i+1}/{len(news_urls)}: {url}")
            
            article_data = scrape_article(url)
            title = article_data.get("title", "No title")
            
            if not article_data["content"]:
                logger.warning(f"❌ Skipped {i+1}/{len(news_urls)}: No content scraped")
                logger.warning(f"   Title: {title[:80]}...")
                logger.warning(f"   URL: {url}")
                continue
            
            # Process with AI analysis directly
            logger.info(f"📄 Processing article {i+1}/{len(news_urls)}: {title[:80]}...")
            
            ai_summary = generate_consumer_sustainability_summary(
                article_data["content"],
                article_data["title"],
                company_name
            )
            
            if ai_summary:
                article_data["ai_summary"] = ai_summary
                articles.append(article_data)
                logger.info(f"🤖 AI analysis {i+1}/{len(news_urls)}: Generated consumer summary")
                logger.info(f"   Summary: {ai_summary[:100]}...")
            else:
                logger.info(f"❌ AI analysis {i+1}/{len(news_urls)}: No relevant sustainability content found")
                logger.info(f"   Title: {title[:80]}...")
                logger.info(f"   Reason: AI determined no consumer-relevant sustainability info")
                continue  # Skip articles with no sustainability relevance
            logger.info(f"✅ Article {i+1}/{len(news_urls)} successfully processed and added")
        
        return {
            "articles": articles,
            "status": "content_analyzed"
        }
        
    except Exception as e:
        logger.error(f"Content analysis failed: {e}")
        return {
            "articles": [],
            "errors": state.get("errors", []) + [f"Content analysis error: {str(e)}"],
            "status": "failed"
        }



def summary_generation_node(state):
    """Generate simplified sustainability summary with latest news and product analysis"""
    logger.info("Generating sustainability summary")
    
    try:
        product_data = state.get("product_data") or {}
        articles = state.get("articles", [])
        
        summary = []
        
        # Add latest company news with AI-generated consumer summaries
        for article in articles[:5]:  # Top 5 articles
            url = article.get("url", "")
            
            # Use AI-generated summary if available, otherwise fallback
            ai_summary = article.get("ai_summary")
            if ai_summary:
                summary_text = ai_summary
                text_lower = ai_summary.lower()
                
                # Detailed tagging logic
                if any(k in text_lower for k in ["carbon", "emission", "climate", "greenhouse", "energy", "renewable", "pollution"]):
                    tag = "climate & emissions"
                elif any(k in text_lower for k in ["packaging", "waste", "plastic", "recycling", "recyclable", "compostable"]):
                    tag = "packaging & waste"
                elif any(k in text_lower for k in ["water", "deforestation", "forest", "biodiversity", "ecosystem"]):
                    tag = "natural resources"
                elif any(k in text_lower for k in ["labor", "union", "wage", "strike", "overtime", "working conditions"]):
                    tag = "labor rights"
                elif any(k in text_lower for k in ["diversity", "inclusion", "equity", "minority", "lgbt", "gender"]):
                    tag = "diversity & inclusion"
                elif any(k in text_lower for k in ["child labor", "forced labor", "human trafficking", "human rights"]):
                    tag = "human rights"
                elif any(k in text_lower for k in ["corruption", "bribery", "transparency", "audit", "accountability"]):
                    tag = "corporate governance"
                elif any(k in text_lower for k in ["board", "executive pay", "shareholder", "ceo", "oversight"]):
                    tag = "leadership & accountability"
                elif any(k in text_lower for k in ["tax avoidance", "antitrust", "monopoly", "competition"]):
                    tag = "market ethics"
                elif any(k in text_lower for k in ["greenwashing", "eco-friendly", "sustainability claim", "certification"]):
                    tag = "sustainability claims & transparency"
                else:
                    tag = "general ethics"
                
                summary.append({
                    "text": summary_text,
                    "tag": tag,
                    "sources": [url]
                })
        
        # Filter for relevance and deduplicate similar summaries using LLM
        if summary and len(summary) > 0:
            company_name = state.get("company_name", "Unknown Company")
            summary = filter_and_deduplicate_summaries(summary, company_name)
        
        # Create final report
        final_report = {
            "product_id": state["product_identifier"],
            "product_name": product_data.get("product_name", "Unknown Product"),
            "brand": state.get("company_name", "Unknown Brand"),
            "summary": summary,
            "metadata": {
                "analysis_date": datetime.now().isoformat(),
                "news_articles_analyzed": len(articles),
                "data_freshness": "recent" if articles else "limited"
            }
        }
        
        return {
            "final_report": final_report,
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        return {
            "final_report": None,
            "errors": state.get("errors", []) + [f"Report generation error: {str(e)}"],
            "status": "failed"
        }
