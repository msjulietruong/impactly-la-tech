"""
Simple sustainability analysis agent using LangGraph
"""
import logging
from langgraph.graph import StateGraph, END
from .utils.state import SustainabilityState
from .utils.nodes import (
    data_retrieval_node,
    news_search_node,
    content_analysis_node,
    summary_generation_node
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_sustainability_agent():
    """Create the sustainability analysis workflow"""
    
    # Create the workflow graph
    workflow = StateGraph(SustainabilityState)
    
    # Add all the nodes (removed scoring node)
    workflow.add_node("retrieve_data", data_retrieval_node)
    workflow.add_node("search_news", news_search_node)
    workflow.add_node("analyze_content", content_analysis_node)
    workflow.add_node("generate_report", summary_generation_node)
    
    # Define the simplified flow
    workflow.set_entry_point("retrieve_data")
    workflow.add_edge("retrieve_data", "search_news")
    workflow.add_edge("search_news", "analyze_content")
    workflow.add_edge("analyze_content", "generate_report")
    workflow.add_edge("generate_report", END)
    
    # Compile the workflow
    app = workflow.compile()
    
    logger.info("Sustainability analysis agent created successfully")
    return app


def analyze_product(product_identifier: str):
    """
    Analyze a product's sustainability
    
    Args:
        product_identifier: Product code or name to analyze
    
    Returns:
        Dictionary with the analysis results
    """
    logger.info(f"Starting analysis for: {product_identifier}")
    
    # Create the agent
    agent = create_sustainability_agent()
    
    # Initial state (simplified)
    initial_state = {
        "product_identifier": product_identifier,
        "product_data": None,
        "company_data": None,
        "company_name": None,
        "news_urls": [],
        "articles": [],
        "final_report": None,
        "errors": [],
        "status": "started"
    }
    
    try:
        # Run the analysis
        result = agent.invoke(initial_state)
        
        logger.info(f"Analysis completed with status: {result.get('status')}")
        return result
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        return {
            "status": "failed",
            "errors": [f"Workflow error: {str(e)}"],
            "final_report": None
        }


# Simple function to get just the report
def get_sustainability_report(product_identifier: str):
    """Get the sustainability report for a product"""
    result = analyze_product(product_identifier)
    return result.get("final_report")
