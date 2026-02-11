from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class UserStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    # New users are always registered as "user" role
    # Admin role can only be set manually in database

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    status: UserStatus
    created_at: datetime

class UserApproval(BaseModel):
    user_id: str
    action: str  # "approve" or "reject"

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Document Schemas
class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class DocumentBase(BaseModel):
    filename: str
    file_type: str
    owner_id: str

class DocumentCreate(DocumentBase):
    content: str

class DocumentResponse(DocumentBase):
    id: str
    upload_date: datetime
    risk_level: Optional[RiskLevel] = None
    risk_score: Optional[float] = None
    explanation: Optional[str] = None
    status: str # pending, approved, rejected, escalated

class DocumentDecision(BaseModel):
    decision: str  # "approved", "rejected", "request_changes"
    comment: Optional[str] = None

