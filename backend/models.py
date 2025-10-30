from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(enum.Enum):
    ADMIN = "admin"
    PRODUCT = "product"
    FINANCE = "finance"
    TRANSLATOR = "translator"

class ProjectStatus(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class TaskStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEW = "review"
    APPROVED = "approved"
    REJECTED = "rejected"

class InvoiceStatus(enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    translator_profile = relationship("Translator", back_populates="user", uselist=False)
    created_projects = relationship("Project", back_populates="created_by")

class Translator(Base):
    __tablename__ = "translators"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    specializations = Column(JSON)  # List of locales they specialize in
    rates = Column(JSON)  # Rates per locale/word
    bio = Column(Text)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="translator_profile")
    tasks = relationship("TranslationTask", back_populates="translator")
    invoices = relationship("Invoice", back_populates="translator")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    repository_url = Column(String)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)
    target_locales = Column(JSON)  # List of locale codes
    auto_approval_threshold = Column(Float, default=1000.0)  # Auto-approve below this cost
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    created_by = relationship("User", back_populates="created_projects")
    tasks = relationship("TranslationTask", back_populates="project")
    invoices = relationship("Invoice", back_populates="project")

class TranslationTask(Base):
    __tablename__ = "translation_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    translator_id = Column(Integer, ForeignKey("translators.id"))
    locale = Column(String, nullable=False)
    source_files = Column(JSON)  # List of file paths
    target_files = Column(JSON)  # List of translated file paths
    word_count = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    estimated_hours = Column(Float, default=0.0)
    actual_hours = Column(Float, default=0.0)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    deadline = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Translation Memory and AI savings
    tm_matches = Column(JSON)  # Translation Memory matches
    ai_suggestions = Column(JSON)  # AI translation suggestions
    tm_savings = Column(Float, default=0.0)
    ai_savings = Column(Float, default=0.0)
    
    # Quality metrics
    translation_stats = Column(JSON)  # {total, translated, warnings, errors}
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    translator = relationship("Translator", back_populates="tasks")

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, nullable=False)
    translator_id = Column(Integer, ForeignKey("translators.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    period_start = Column(DateTime(timezone=True))
    period_end = Column(DateTime(timezone=True))
    total_amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    submitted_at = Column(DateTime(timezone=True))
    approved_at = Column(DateTime(timezone=True))
    paid_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Invoice details
    line_items = Column(JSON)  # List of {task_id, description, quantity, rate, amount}
    notes = Column(Text)
    
    # Relationships
    translator = relationship("Translator", back_populates="invoices")
    project = relationship("Project", back_populates="invoices")

class TranslationMemory(Base):
    __tablename__ = "translation_memory"
    
    id = Column(Integer, primary_key=True, index=True)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False)
    source_locale = Column(String, default="en-US")
    target_locale = Column(String, nullable=False)
    context = Column(String)  # File path or context information
    quality_score = Column(Float, default=1.0)  # 0.0 to 1.0
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Glossary(Base):
    __tablename__ = "glossary"
    
    id = Column(Integer, primary_key=True, index=True)
    term = Column(String, nullable=False)
    definition = Column(Text)
    translations = Column(JSON)  # {locale: translation}
    category = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AITranslation(Base):
    __tablename__ = "ai_translations"
    
    id = Column(Integer, primary_key=True, index=True)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False)
    source_locale = Column(String, default="en-US")
    target_locale = Column(String, nullable=False)
    model_used = Column(String)  # GPT-4, GPT-3.5, etc.
    confidence_score = Column(Float)
    human_reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(String, unique=True, nullable=False)
    context = Column(JSON)  # Store conversation context
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), onupdate=func.now())