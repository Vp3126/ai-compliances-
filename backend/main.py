from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.wsgi import WSGIMiddleware
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime
from bson import ObjectId
import os

from backend.database import users_collection, check_db_connection
from backend.schemas import UserRegister, UserLogin, UserOut, Token, TokenData, UserRole
from backend.auth_utils import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM
# from backend.flask_app import flask_app  # COMMENTED OUT - was blocking /admin routes

app = FastAPI(title="AI Compliance & Decision Review API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Flask app - COMMENTED OUT - was blocking FastAPI /admin routes
# app.mount("/admin", WSGIMiddleware(flask_app))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@app.on_event("startup")
async def startup_db_client():
    await check_db_connection()

# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, role=role)
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception
    return user

# Helper for Role Based Access Control
def check_role(roles: list[UserRole]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough permissions to perform this action"
            )
        return current_user
    return role_checker

@app.get("/")
async def root():
    return {"message": "AI Compliance API is running"}

@app.post("/register", response_model=UserOut)
async def register(user: UserRegister):
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "email": user.email,
        "password": hashed_password,
        "full_name": user.full_name,
        "role": "user",  # All new registrations are "user" role
        "status": "pending",  # Require admin approval
        "created_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(user_dict)
    
    return {
        "id": str(result.inserted_id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user_dict["role"],
        "status": user_dict["status"],
        "created_at": user_dict["created_at"]
    }

@app.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is approved
    if user.get("status") == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin approval. Please wait for activation.",
        )
    
    if user.get("status") == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account registration was rejected by an administrator.",
        )
    
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserOut)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "role": current_user["role"],
        "status": current_user.get("status", "approved"),  # Legacy users get approved status
        "created_at": current_user["created_at"]
    }

# --- ADMIN USER MANAGEMENT ---
from backend.schemas import UserApproval

@app.get("/admin/pending-users")
async def get_pending_users(current_user: dict = Depends(check_role([UserRole.ADMIN]))):
    """Admin only: Get all users pending approval"""
    cursor = users_collection.find({"status": "pending"})
    pending_users = await cursor.to_list(length=100)
    
    result = []
    for user in pending_users:
        result.append({
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "created_at": user["created_at"]
        })
    return result

@app.post("/admin/approve-user")
async def approve_user(
    approval: UserApproval,
    current_user: dict = Depends(check_role([UserRole.ADMIN]))
):
    """Admin only: Approve or reject a user registration"""
    from bson import ObjectId
    
    if approval.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    new_status = "approved" if approval.action == "approve" else "rejected"
    
    result = await users_collection.update_one(
        {"_id": ObjectId(approval.user_id)},
        {"$set": {"status": new_status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User {approval.action}d successfully", "status": new_status}

@app.get("/admin/all-users-test")
async def get_all_users_test():
    """TEST: Get all users WITHOUT authentication"""
    print(f"SEARCH: TEST endpoint called!")
    
    cursor = users_collection.find({})
    all_users = await cursor.to_list(length=1000)
    
    print(f"STATUS: Found {len(all_users)} users in database")
    
    result = []
    for user in all_users:
        result.append({
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "status": user.get("status", "approved"),
            "created_at": user["created_at"]
        })
    
    print(f"SUCCESS: Returning {len(result)} users")
    return result

@app.get("/admin/all-users")
async def get_all_users(current_user: dict = Depends(check_role([UserRole.ADMIN]))):
    """Admin only: Get all users with their status"""
    print(f"SEARCH: Admin all-users endpoint called by: {current_user.get('email')}")
    
    cursor = users_collection.find({})
    all_users = await cursor.to_list(length=1000)
    
    print(f"STATUS: Found {len(all_users)} users in database")
    
    result = []
    for user in all_users:
        result.append({
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "status": user.get("status", "approved"),
            "created_at": user["created_at"]
        })
    
    print(f"SUCCESS: Returning {len(result)} users to frontend")
    return result

# --- DOCUMENT MODULES ---
from fastapi import UploadFile, File, BackgroundTasks
from backend.document_utils import extract_text_from_file, validate_file_size, validate_file_type
from backend.ai_agents import analyze_document
from backend.database import documents_collection

async def run_analysis(document_id: str, document_text: str):
    """Background task for AI analysis"""
    try:
        print(f"AI: Starting background AI analysis for {document_id}...")
        analysis_result = await analyze_document(document_text)
        
        # Update document with analysis results
        score = analysis_result.get("compliance_score", 0)
        status = "completed"
        if score < 70:
            status = "escalated"
            print(f"ALERT: Document {document_id} escalated due to low score: {score}")

        await documents_collection.update_one(
            {"_id": ObjectId(document_id)},
            {
                "$set": {
                    "status": status,
                    "analysis": analysis_result,
                    "analyzed_at": datetime.utcnow(),
                    "compliance_score": score
                }
            }
        )
        print(f"SUCCESS: Background analysis complete for {document_id}! Score: {score}, Status: {status}")

        
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
        print(f"ERROR: Background analysis failed for {document_id}: {e}")

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
        print(f"FILE: Extracting text from {file.filename}...")
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
        
        print(f"SUCCESS: Document saved with ID: {document_id}")
        
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
        from bson import ObjectId
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
            "text_preview": document.get("text_content", "")[:1000]
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
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

from backend.schemas import DocumentDecision

@app.post("/document/{document_id}/decide")
async def document_decision(
    document_id: str,
    decision_data: DocumentDecision,
    current_user: dict = Depends(check_role([UserRole.ADMIN]))
):
    """Admin only: Record a human decision on an AI analysis"""
    try:
        from bson import ObjectId
        
        # Check if document exists
        document = await documents_collection.find_one({"_id": ObjectId(document_id)})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Update the document with human decision
        update_data = {
            "human_decision": {
                "decision": decision_data.decision,
                "comment": decision_data.comment,
                "decided_by": current_user["email"],
                "decided_at": datetime.utcnow()
            },
            # Map human decision to top-level status if completed
            "status": decision_data.decision if decision_data.decision in ["approved", "rejected"] else document["status"]
        }
        
        result = await documents_collection.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": update_data}
        )
        
@app.get("/document/{document_id}/export")
async def export_document_report(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate a downloadable compliance report for a document"""
    try:
        from bson import ObjectId
        document = await documents_collection.find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Security check
        if document["uploaded_by"] != current_user["email"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
            
        # Create report content
        report = f"""# COMPLIANCE AUDIT REPORT
Document: {document['filename']}
ID: {document_id}
Status: {document['status'].upper()}
Date: {document['uploaded_at'].strftime('%Y-%m-%d %H:%M:%S')}
Owner: {document['uploaded_by']}
Compliance Score: {document.get('compliance_score', 'N/A')}/100

---

## AI AGENT FINDINGS

### 1. Document Preprocessing
{document.get('analysis', {}).get('preprocessing', 'No data available.')}

### 2. Risk Assessment
{document.get('analysis', {}).get('risk_assessment', 'No data available.')}

### 3. Reasoning Analysis
{document.get('analysis', {}).get('reasoning_analysis', 'No data available.')}

### 4. Decision Maker Suggestion
{document.get('analysis', {}).get('final_decision', 'No data available.')}

---

## HUMAN REVIEW DECISION
"""
        if "human_decision" in document:
            hd = document["human_decision"]
            report += f"""Reviewer: {hd['decided_by']}
Decision: {hd['decision'].upper()}
Date: {hd['decided_at'].strftime('%Y-%m-%d %H:%M:%S')}
Comments: {hd.get('comment', 'None')}
"""
        else:
            report += "Status: PENDING HUMAN REVIEW\n"
            
        report += "\n\nGenerated by AI Compliance & Decision Review System"
        
        return {
            "filename": f"report_{document['filename'].replace(' ', '_')}.txt",
            "content": report
        }
        
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


