import random

async def analyze_document_risk(text: str):
    """
    Simulates ML Risk Detection (Phase 3)
    Returns: Risk Score (0-1), Risk Level
    """
    # In a real app, this would use a fine-tuned DistilBERT
    # For now, we simulate logic based on keywords
    risk_keywords = ["termination", "liability", "confidentiality", "indemnity", "dispute"]
    found_keywords = [word for word in risk_keywords if word in text.lower()]
    
    score = min(1.0, len(found_keywords) * 0.2 + random.uniform(0, 0.2))
    
    if score < 0.3:
        level = "low"
    elif score < 0.7:
        level = "medium"
    else:
        level = "high"
        
    return score, level

async def generate_slm_explanation(text: str, risk_score: float, risk_level: str):
    """
    Simulates SLM Reasoning (Phase 4) using TinyLlama or Phi-2
    Returns: Human-readable explanation
    """
    explanations = {
        "low": "The document appears to follow standard compliance guidelines with no critical missing clauses found.",
        "medium": "Potential risks identified in the 'Liability' section. Some clauses are ambiguous and may require secondary review.",
        "high": "Critical compliance failure: The 'Termination' clause is missing mandatory notice periods, violating company policy."
    }
    
    base_explanation = explanations.get(risk_level, "Analysis complete.")
    
    # Simulate SLM generation feel
    return f"AI Analysis Summary: {base_explanation} (Confidence: {int(random.uniform(85, 98))}%)"
