"""
Document Upload and Analysis Endpoints
"""

from fastapi import UploadFile, File, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
import os

# Add these imports to your main.py
from backend.document_utils import extract_text_from_file, validate_file_size, validate_file_type
from backend.ai_agents import analyze_document
from backend.database import documents_collection

async def run_analysis(document_id: str, document_text: str):
    """Background task for AI analysis"""
    try:
        print(f"🤖 Starting background AI analysis for {document_id}...")
        analysis_result = await analyze_document(document_text)
        
        # Update document with analysis results
        await documents_collection.update_one(
            {"_id": ObjectId(document_id)},
            {
                "$set": {
                    "status": "completed",
                    "analysis": analysis_result,
                    "analyzed_at": datetime.utcnow(),
                    "compliance_score": analysis_result.get("compliance_score", 0)
                }
            }
        )
        print(f"✅ Background analysis complete for {document_id}! Score: {analysis_result.get('compliance_score', 'N/A')}")
        
    except Exception as e:
        # Update status to failed
        await documents_collection.update_one(
            {"_id": ObjectId(document_id)},
            {
                "$set": {
                    "status": "failed",
                    "error": str(e),
                    "analyzed_at": datetime.utcnow()
                }
            }
        )
        print(f"❌ Background analysis failed for {document_id}: {e}")

# Document Upload Endpoint
@app.post("/upload-document")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a document for compliance analysis
    
    Supported formats: PDF, DOCX, TXT
    Max size: 10MB
    """
    try:
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file
        validate_file_size(file_size)
        validate_file_type(file.filename)
        
        # Extract text
        print(f"📄 Extracting text from {file.filename}...")
        document_text = extract_text_from_file(file.filename, file_content)
        
        if not document_text or len(document_text) < 50:
            raise HTTPException(
                status_code=400,
                detail="Document appears to be empty or too short for analysis"
            )
        
        # Create document record
        document_data = {
            "filename": file.filename,
            "file_size": file_size,
            "uploaded_by": current_user["email"],
            "uploaded_at": datetime.utcnow(),
            "status": "processing",
            "text_content": document_text[:5000],  # Store first 5000 chars
            "full_text_length": len(document_text)
        }
        
        # Save to database
        result = await documents_collection.insert_one(document_data)
        document_id = str(result.inserted_id)
        
        print(f"✅ Document saved with ID: {document_id}")
        
        # Add analysis to background tasks
        background_tasks.add_task(run_analysis, document_id, document_text)
        
        return {
            "message": "Document uploaded successfully. Analysis started in background.",
            "document_id": document_id,
            "filename": file.filename,
            "status": "processing"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Get User's Documents
@app.get("/my-documents")
async def get_my_documents(current_user: dict = Depends(get_current_user)):
    """Get all documents uploaded by the current user"""
    try:
        cursor = documents_collection.find({"uploaded_by": current_user["email"]})
        documents = await cursor.to_list(length=100)
        
        result = []
        for doc in documents:
            result.append({
                "id": str(doc["_id"]),
                "filename": doc["filename"],
                "file_size": doc["file_size"],
                "uploaded_at": doc["uploaded_at"],
                "status": doc["status"],
                "compliance_score": doc.get("compliance_score", None)
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get Document Analysis
@app.get("/document/{document_id}")
async def get_document_analysis(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed analysis of a specific document"""
    try:
        document = await documents_collection.find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Check if user owns this document or is admin
        if document["uploaded_by"] != current_user["email"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "id": str(document["_id"]),
            "filename": document["filename"],
            "file_size": document["file_size"],
            "uploaded_by": document["uploaded_by"],
            "uploaded_at": document["uploaded_at"],
            "status": document["status"],
            "compliance_score": document.get("compliance_score", None),
            "analysis": document.get("analysis", {}),
            "text_preview": document.get("text_content", "")[:500]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin: Get All Documents
@app.get("/admin/all-documents")
async def get_all_documents(current_user: dict = Depends(check_role([UserRole.ADMIN]))):
    """Admin only: Get all documents from all users"""
    try:
        cursor = documents_collection.find({})
        documents = await cursor.to_list(length=1000)
        
        result = []
        for doc in documents:
            result.append({
                "id": str(doc["_id"]),
                "filename": doc["filename"],
                "file_size": doc["file_size"],
                "uploaded_by": doc["uploaded_by"],
                "uploaded_at": doc["uploaded_at"],
                "status": doc["status"],
                "compliance_score": doc.get("compliance_score", None)
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
