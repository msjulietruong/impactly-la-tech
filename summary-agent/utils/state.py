"""
State definition for the sustainability analysis workflow
"""
from typing import TypedDict, List, Optional, Dict, Any


class SustainabilityState(TypedDict):
    """Simple state for sustainability analysis"""
    
    # Input
    product_identifier: str
    
    # Data from MongoDB
    product_data: Optional[Dict[str, Any]]
    company_data: Optional[Dict[str, Any]]
    company_name: Optional[str]
    
    # News search results
    news_urls: List[str]
    
    # Analyzed articles
    articles: List[Dict[str, Any]]
    
    # Final output
    final_report: Optional[Dict[str, Any]]
    
    # Status tracking
    errors: List[str]
    status: str
