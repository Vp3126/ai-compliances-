"""
AI Agents for SLM Compliance & Decision Review System

This module defines 4 AI agents using CrewAI:
1. Preprocessing Curator - Extracts and cleans document data
2. Risk Auditor - Identifies compliance risks
3. Reasoning Analyst - Analyzes context and generates insights
4. Decision Maker - Makes final compliance decisions
"""

import os
from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import Dict, Any

# Initialize Gemini LLM
def get_llm():
    """Initialize Google Gemini LLM"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")
    
    return ChatGoogleGenerativeAI(
        model="gemini-flash-latest",
        google_api_key=api_key,
        temperature=0.7,
        convert_system_message_to_human=True
    )

# Agent 1: Preprocessing Curator
def create_preprocessing_agent(llm):
    """
    Agent responsible for extracting and cleaning document data
    """
    return Agent(
        role="Document Preprocessing Curator",
        goal="Extract, clean, and normalize text from uploaded documents",
        backstory="""You are an expert document processor with years of experience 
        in handling various document formats. Your specialty is extracting clean, 
        structured data from messy documents while preserving important context.""",
        llm=llm,
        verbose=True,
        allow_delegation=False
    )

# Agent 2: Risk Auditor
def create_risk_auditor_agent(llm):
    """
    Agent responsible for identifying compliance risks
    """
    return Agent(
        role="Compliance Risk Auditor",
        goal="Identify potential compliance risks and regulatory violations",
        backstory="""You are a seasoned compliance officer with expertise in 
        regulatory frameworks, risk assessment, and audit procedures. You have 
        a keen eye for spotting potential violations and assessing their severity.""",
        llm=llm,
        verbose=True,
        allow_delegation=False
    )

# Agent 3: Reasoning Analyst
def create_reasoning_analyst_agent(llm):
    """
    Agent responsible for analyzing context and generating insights
    """
    return Agent(
        role="Legal Reasoning Analyst",
        goal="Analyze document context and generate detailed reasoning chains",
        backstory="""You are a legal analyst with deep understanding of regulatory 
        compliance, legal reasoning, and decision-making frameworks. You excel at 
        connecting dots and building comprehensive reasoning chains.""",
        llm=llm,
        verbose=True,
        allow_delegation=False
    )

# Agent 4: Decision Maker
def create_decision_maker_agent(llm):
    """
    Agent responsible for final compliance decisions
    """
    return Agent(
        role="Compliance Decision Maker",
        goal="Make final compliance decisions and generate actionable recommendations",
        backstory="""You are a senior compliance executive with authority to make 
        final decisions on regulatory matters. You synthesize all available information 
        to make informed, defensible decisions with clear recommendations.""",
        llm=llm,
        verbose=True,
        allow_delegation=False
    )

# Task Definitions
def create_preprocessing_task(agent, document_text: str):
    """Create preprocessing task"""
    return Task(
        description=f"""
        Extract and clean the following document text:
        
        {document_text[:2000]}...
        
        Your tasks:
        1. Remove any formatting artifacts
        2. Identify document type (contract, policy, report, etc.)
        3. Extract key sections and metadata
        4. Normalize text for analysis
        5. Highlight any data quality issues
        
        Provide a structured summary of the cleaned document.
        """,
        agent=agent,
        expected_output="A structured summary with cleaned text, document type, key sections, and metadata"
    )

def create_risk_audit_task(agent, preprocessed_data: str):
    """Create risk audit task"""
    return Task(
        description=f"""
        Analyze the following preprocessed document for compliance risks:
        
        {preprocessed_data}
        
        Your tasks:
        1. Identify potential regulatory violations
        2. Assess risk severity (Low, Medium, High, Critical)
        3. Flag specific clauses or sections of concern
        4. List applicable regulations or standards
        5. Provide risk scores (0-100)
        
        Generate a comprehensive risk assessment report.
        """,
        agent=agent,
        expected_output="A detailed risk assessment with severity levels, flagged sections, and risk scores"
    )

def create_reasoning_task(agent, risk_assessment: str):
    """Create reasoning analysis task"""
    return Task(
        description=f"""
        Analyze the following risk assessment and build reasoning chains:
        
        {risk_assessment}
        
        Your tasks:
        1. Explain the reasoning behind each identified risk
        2. Connect risks to specific regulatory requirements
        3. Analyze potential consequences
        4. Identify mitigating factors
        5. Build logical reasoning chains
        
        Provide detailed reasoning for all findings.
        """,
        agent=agent,
        expected_output="Comprehensive reasoning chains explaining all risks and their regulatory connections"
    )

def create_decision_task(agent, reasoning_analysis: str):
    """Create final decision task"""
    return Task(
        description=f"""
        Based on the following analysis, make a final compliance decision:
        
        {reasoning_analysis}
        
        Your tasks:
        1. Make a clear APPROVE/REJECT/CONDITIONAL decision
        2. Provide specific recommendations
        3. List required actions or remediation steps
        4. Assign overall compliance score (0-100)
        5. Generate executive summary
        
        Deliver a final compliance decision report.
        """,
        agent=agent,
        expected_output="Final compliance decision with recommendations, action items, and compliance score"
    )

# Main Analysis Function
async def analyze_document(document_text: str) -> Dict[str, Any]:
    """
    Main function to analyze a document using all 4 AI agents
    
    Args:
        document_text: The text content of the document to analyze
        
    Returns:
        Dictionary containing analysis results from all agents
    """
    try:
        # Initialize LLM
        llm = get_llm()
        
        # Create agents
        preprocessing_agent = create_preprocessing_agent(llm)
        risk_auditor = create_risk_auditor_agent(llm)
        reasoning_analyst = create_reasoning_analyst_agent(llm)
        decision_maker = create_decision_maker_agent(llm)
        
        # Create tasks
        preprocessing_task = create_preprocessing_task(preprocessing_agent, document_text)
        
        # Create crew for preprocessing
        preprocessing_crew = Crew(
            agents=[preprocessing_agent],
            tasks=[preprocessing_task],
            process=Process.sequential,
            verbose=True
        )
        
        # Execute preprocessing
        print("STEP 1: Preprocessing document...")
        preprocessing_result = preprocessing_crew.kickoff()
        
        # Create and execute risk audit
        risk_task = create_risk_audit_task(risk_auditor, str(preprocessing_result))
        risk_crew = Crew(
            agents=[risk_auditor],
            tasks=[risk_task],
            process=Process.sequential,
            verbose=True
        )
        
        print("STEP 2: Auditing risks...")
        risk_result = risk_crew.kickoff()
        
        # Create and execute reasoning analysis
        reasoning_task = create_reasoning_task(reasoning_analyst, str(risk_result))
        reasoning_crew = Crew(
            agents=[reasoning_analyst],
            tasks=[reasoning_task],
            process=Process.sequential,
            verbose=True
        )
        
        print("STEP 3: Analyzing reasoning...")
        reasoning_result = reasoning_crew.kickoff()
        
        # Create and execute final decision
        decision_task = create_decision_task(decision_maker, str(reasoning_result))
        decision_crew = Crew(
            agents=[decision_maker],
            tasks=[decision_task],
            process=Process.sequential,
            verbose=True
        )
        
        print("STEP 4: Making final decision...")
        decision_result = decision_crew.kickoff()
        
        # Compile results
        return {
            "status": "success",
            "preprocessing": str(preprocessing_result),
            "risk_assessment": str(risk_result),
            "reasoning_analysis": str(reasoning_result),
            "final_decision": str(decision_result),
            "compliance_score": extract_compliance_score(str(decision_result))
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def extract_compliance_score(decision_text: str) -> int:
    """Extract compliance score from decision text"""
    # Simple extraction - can be improved with regex
    try:
        if "compliance score" in decision_text.lower():
            # Extract number between 0-100
            import re
            match = re.search(r'compliance score[:\s]+(\d+)', decision_text, re.IGNORECASE)
            if match:
                return int(match.group(1))
        return 75  # Default score
    except:
        return 75

# Test function
if __name__ == "__main__":
    import asyncio
    
    sample_text = """
    This is a sample compliance document for testing purposes.
    The company agrees to maintain proper records and comply with all applicable regulations.
    However, there are some concerns about data privacy practices.
    """
    
    result = asyncio.run(analyze_document(sample_text))
    print("\n" + "="*60)
    print("ANALYSIS COMPLETE")
    print("="*60)
    print(f"Status: {result['status']}")
    print(f"Compliance Score: {result.get('compliance_score', 'N/A')}")
