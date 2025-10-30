from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from models import UserRole, ProjectStatus, TaskStatus, InvoiceStatus

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# Translator schemas
class TranslatorBase(BaseModel):
    specializations: List[str] = []
    rates: Dict[str, float] = {}
    bio: Optional[str] = None
    is_available: bool = True

class TranslatorCreate(TranslatorBase):
    user_id: int

class TranslatorUpdate(TranslatorBase):
    pass

class Translator(TranslatorBase):
    id: int
    user_id: int
    created_at: datetime
    user: User
    
    class Config:
        from_attributes = True

# Project schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    repository_url: Optional[str] = None
    target_locales: List[str] = []
    auto_approval_threshold: float = 1000.0

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    repository_url: Optional[str] = None
    status: Optional[ProjectStatus] = None
    target_locales: Optional[List[str]] = None
    auto_approval_threshold: Optional[float] = None

class Project(ProjectBase):
    id: int
    status: ProjectStatus
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Translation Task schemas
class TranslationTaskBase(BaseModel):
    project_id: int
    translator_id: int
    locale: str
    source_files: List[str] = []
    word_count: int = 0
    estimated_cost: float = 0.0
    estimated_hours: float = 0.0
    deadline: Optional[datetime] = None

class TranslationTaskCreate(TranslationTaskBase):
    pass

class TranslationTaskUpdate(BaseModel):
    translator_id: Optional[int] = None
    target_files: Optional[List[str]] = None
    actual_cost: Optional[float] = None
    actual_hours: Optional[float] = None
    status: Optional[TaskStatus] = None
    completed_at: Optional[datetime] = None
    translation_stats: Optional[Dict[str, Any]] = None
    tm_savings: Optional[float] = None
    ai_savings: Optional[float] = None

class TranslationTask(TranslationTaskBase):
    id: int
    target_files: List[str] = []
    actual_cost: float = 0.0
    actual_hours: float = 0.0
    status: TaskStatus
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    tm_matches: Optional[Dict[str, Any]] = None
    ai_suggestions: Optional[Dict[str, Any]] = None
    tm_savings: float = 0.0
    ai_savings: float = 0.0
    translation_stats: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

# Invoice schemas
class InvoiceBase(BaseModel):
    translator_id: int
    project_id: int
    period_start: datetime
    period_end: datetime
    total_amount: float
    currency: str = "USD"
    line_items: List[Dict[str, Any]] = []
    notes: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    notes: Optional[str] = None
    approved_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None

class Invoice(InvoiceBase):
    id: int
    invoice_number: str
    status: InvoiceStatus
    submitted_at: Optional[datetime]
    approved_at: Optional[datetime]
    paid_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Translation Memory schemas
class TranslationMemoryBase(BaseModel):
    source_text: str
    target_text: str
    source_locale: str = "en-US"
    target_locale: str
    context: Optional[str] = None
    quality_score: float = 1.0

class TranslationMemoryCreate(TranslationMemoryBase):
    pass

class TranslationMemory(TranslationMemoryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Glossary schemas
class GlossaryBase(BaseModel):
    term: str
    definition: Optional[str] = None
    translations: Dict[str, str] = {}
    category: Optional[str] = None

class GlossaryCreate(GlossaryBase):
    pass

class Glossary(GlossaryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# AI Translation schemas
class AITranslationRequest(BaseModel):
    source_text: str
    source_locale: str = "en-US"
    target_locale: str
    use_glossary: bool = True
    use_tm: bool = True

class AITranslationResponse(BaseModel):
    target_text: str
    confidence_score: float
    model_used: str
    tm_matches: List[Dict[str, Any]] = []
    glossary_matches: List[Dict[str, Any]] = []

# Report schemas
class LocaleStats(BaseModel):
    locale: str
    total_strings: int
    translated_strings: int
    warnings: int
    errors: int
    completion_percentage: float
    cost: float
    tm_savings: float
    ai_savings: float

class ProjectReport(BaseModel):
    project_id: int
    project_name: str
    locale_stats: List[LocaleStats]
    total_cost: float
    total_savings: float
    completion_percentage: float

class TranslatorReport(BaseModel):
    translator_id: int
    translator_name: str
    total_earnings: float
    completed_tasks: int
    pending_tasks: int
    average_quality_score: float

class FinancialReport(BaseModel):
    period_start: datetime
    period_end: datetime
    total_spending: float
    spending_by_project: Dict[str, float]
    spending_by_translator: Dict[str, float]
    spending_by_locale: Dict[str, float]
    projected_spending: float

# Chat schemas
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    message: str
    session_id: str
    suggestions: List[str] = []