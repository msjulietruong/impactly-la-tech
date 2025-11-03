import os, logging
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(), override=False)

from utils.nodes import (
    data_retrieval_node, news_search_node, content_analysis_node,
    summary_generation_node
)

logging.basicConfig(level=os.getenv("LOG_LEVEL","INFO"))
logger = logging.getLogger("python-svc")
app = FastAPI()

INTERNAL_KEY = os.getenv("INTERNAL_API_KEY")

class WorkflowRequest(BaseModel):
    product_identifier: str
    days: Optional[int] = None

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.post("/workflow/run")
def run_workflow(req: WorkflowRequest, x_internal_key: Optional[str] = Header(None)):
    if INTERNAL_KEY and x_internal_key != INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        state = {"product_identifier": req.product_identifier, "errors": []}

        state.update(data_retrieval_node(state))
        state.update(news_search_node(state))
        state.update(content_analysis_node(state))
        state.update(summary_generation_node(state))
    except Exception as e:
        logger.exception("Workflow execution failed")
        raise HTTPException(status_code=500, detail=f"Workflow failed: {str(e)}")

    return {
        "status": state.get("status", "completed"),
        "final_report": state.get("final_report"),
        "errors": state.get("errors"),
    }
