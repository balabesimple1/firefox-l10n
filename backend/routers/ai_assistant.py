from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import openai
import json
import uuid
from datetime import datetime, timedelta
from database import get_db, settings
from models import (
    User, ChatSession, TranslationMemory, Glossary, AITranslation,
    Project, TranslationTask, Invoice, UserRole
)
from schemas import (
    ChatRequest, ChatResponse, ChatMessage, 
    AITranslationRequest, AITranslationResponse,
    TranslationMemory as TranslationMemorySchema,
    Glossary as GlossarySchema
)
from auth import get_current_active_user, require_admin

router = APIRouter()

# Initialize OpenAI client
if settings.openai_api_key:
    openai.api_key = settings.openai_api_key

def get_role_context(user_role: UserRole) -> str:
    """Get role-specific context for the AI assistant"""
    contexts = {
        UserRole.PRODUCT: """
        You are an AI assistant for the Product Team in a localization workflow system. 
        You can help with:
        - Creating and managing localization projects
        - Tracking translation progress and costs
        - Managing locale assignments and translator assignments
        - Viewing cost estimates and delivery dates
        - Monitoring translation quality and completion rates
        - Approving translation requests and invoices
        """,
        UserRole.FINANCE: """
        You are an AI assistant for the Finance Team in a localization workflow system.
        You can help with:
        - Viewing and managing invoices and payouts
        - Tracking translation spending by project, translator, and time period
        - Monitoring budget vs actual spending
        - Approving invoice payments
        - Generating financial reports and forecasts
        """,
        UserRole.TRANSLATOR: """
        You are an AI assistant for Translators in a localization workflow system.
        You can help with:
        - Viewing assigned translation tasks
        - Uploading completed translations
        - Submitting cost and time estimates
        - Creating and managing invoices
        - Accessing translation memory and glossary
        - Getting AI translation suggestions
        """,
        UserRole.ADMIN: """
        You are an AI assistant for the Admin Team in a localization workflow system.
        You can help with:
        - Managing projects, translators, and users
        - Configuring translator rates and assignments
        - Managing translation memory and glossary
        - Viewing comprehensive reports across all teams
        - Configuring AI translation settings
        - System administration tasks
        """
    }
    return contexts.get(user_role, "You are an AI assistant for a localization workflow system.")

def get_conversation_starters(user_role: UserRole) -> List[str]:
    """Get role-specific conversation starters"""
    starters = {
        UserRole.PRODUCT: [
            "Show me the status of my current localization projects",
            "What's the estimated cost for translating Project X to French?",
            "Which translators are available for German localization?",
            "How much have we saved using Translation Memory this month?",
            "Show me projects that need approval"
        ],
        UserRole.FINANCE: [
            "What's our total translation spending this quarter?",
            "Show me pending invoices that need approval",
            "Which translators have the highest earnings this month?",
            "What's our budget vs actual spending breakdown?",
            "Generate a financial report for Q3"
        ],
        UserRole.TRANSLATOR: [
            "What translation tasks are assigned to me?",
            "Help me create an invoice for this month's work",
            "Show me translation memory matches for this text",
            "What's my earnings summary for this year?",
            "How do I upload completed translations?"
        ],
        UserRole.ADMIN: [
            "Show me all active projects and their status",
            "Which translators need rate updates?",
            "Generate a comprehensive system report",
            "How is our AI translation performing?",
            "Show me user activity across all teams"
        ]
    }
    return starters.get(user_role, [])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    chat_request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Chat with the AI assistant"""
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503, 
            detail="AI service not configured. Please set OPENAI_API_KEY."
        )
    
    # Get or create chat session
    session_id = chat_request.session_id or str(uuid.uuid4())
    
    chat_session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not chat_session:
        chat_session = ChatSession(
            session_id=session_id,
            user_id=current_user.id,
            context=chat_request.context or {}
        )
        db.add(chat_session)
    else:
        chat_session.last_activity = datetime.utcnow()
    
    # Build conversation context
    role_context = get_role_context(current_user.role)
    
    # Get relevant data based on user role for context
    context_data = {}
    
    if current_user.role == UserRole.PRODUCT:
        # Get user's projects
        projects = db.query(Project).filter(Project.created_by_id == current_user.id).limit(5).all()
        context_data["recent_projects"] = [{"id": p.id, "name": p.name, "status": p.status.value} for p in projects]
    
    elif current_user.role == UserRole.TRANSLATOR and current_user.translator_profile:
        # Get translator's tasks
        tasks = db.query(TranslationTask).filter(
            TranslationTask.translator_id == current_user.translator_profile.id
        ).limit(5).all()
        context_data["recent_tasks"] = [
            {"id": t.id, "project": t.project.name, "locale": t.locale, "status": t.status.value} 
            for t in tasks
        ]
    
    elif current_user.role == UserRole.FINANCE:
        # Get recent invoices
        invoices = db.query(Invoice).limit(5).all()
        context_data["recent_invoices"] = [
            {"id": i.id, "number": i.invoice_number, "amount": i.total_amount, "status": i.status.value}
            for i in invoices
        ]
    
    # Prepare messages for OpenAI
    messages = [
        {"role": "system", "content": f"{role_context}\n\nCurrent user context: {json.dumps(context_data)}"},
        {"role": "user", "content": chat_request.message}
    ]
    
    try:
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        assistant_message = response.choices[0].message.content
        
        # Update chat session context
        if not chat_session.context:
            chat_session.context = {}
        
        chat_session.context["last_message"] = chat_request.message
        chat_session.context["last_response"] = assistant_message
        
        db.commit()
        
        # Generate suggestions based on role
        suggestions = get_conversation_starters(current_user.role)[:3]
        
        return ChatResponse(
            message=assistant_message,
            session_id=session_id,
            suggestions=suggestions
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI service error: {str(e)}"
        )

@router.get("/conversation-starters")
async def get_conversation_starters_endpoint(
    current_user: User = Depends(get_current_active_user)
):
    """Get conversation starters based on user role"""
    return {
        "role": current_user.role.value,
        "starters": get_conversation_starters(current_user.role)
    }

@router.post("/translate", response_model=AITranslationResponse)
async def ai_translate(
    translation_request: AITranslationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get AI translation for text"""
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="AI service not configured. Please set OPENAI_API_KEY."
        )
    
    source_text = translation_request.source_text
    target_locale = translation_request.target_locale
    
    # Check Translation Memory first if requested
    tm_matches = []
    if translation_request.use_tm:
        tm_entries = db.query(TranslationMemory).filter(
            TranslationMemory.source_text.ilike(f"%{source_text}%"),
            TranslationMemory.target_locale == target_locale
        ).limit(3).all()
        
        tm_matches = [
            {
                "source": entry.source_text,
                "target": entry.target_text,
                "quality_score": entry.quality_score,
                "match_percentage": 85  # Simplified calculation
            }
            for entry in tm_entries
        ]
    
    # Check glossary if requested
    glossary_matches = []
    if translation_request.use_glossary:
        glossary_entries = db.query(Glossary).filter(
            Glossary.term.in_(source_text.split())
        ).all()
        
        for entry in glossary_entries:
            if target_locale in entry.translations:
                glossary_matches.append({
                    "term": entry.term,
                    "translation": entry.translations[target_locale],
                    "definition": entry.definition
                })
    
    # Build context for AI translation
    context = f"Translate the following text from {translation_request.source_locale} to {target_locale}."
    
    if glossary_matches:
        glossary_text = "\n".join([
            f"- {match['term']}: {match['translation']}"
            for match in glossary_matches
        ])
        context += f"\n\nUse these glossary terms:\n{glossary_text}"
    
    if tm_matches:
        tm_text = "\n".join([
            f"- \"{match['source']}\" → \"{match['target']}\""
            for match in tm_matches
        ])
        context += f"\n\nConsider these translation memory matches:\n{tm_text}"
    
    context += f"\n\nText to translate: {source_text}"
    
    try:
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional translator. Provide only the translation without explanations."},
                {"role": "user", "content": context}
            ],
            max_tokens=200,
            temperature=0.3
        )
        
        translated_text = response.choices[0].message.content.strip()
        confidence_score = 0.85  # Simplified confidence calculation
        
        # Store AI translation
        ai_translation = AITranslation(
            source_text=source_text,
            target_text=translated_text,
            source_locale=translation_request.source_locale,
            target_locale=target_locale,
            model_used="gpt-4",
            confidence_score=confidence_score
        )
        db.add(ai_translation)
        db.commit()
        
        return AITranslationResponse(
            target_text=translated_text,
            confidence_score=confidence_score,
            model_used="gpt-4",
            tm_matches=tm_matches,
            glossary_matches=glossary_matches
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Translation service error: {str(e)}"
        )

@router.get("/translation-memory")
async def get_translation_memory(
    source_locale: str = "en-US",
    target_locale: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get translation memory entries"""
    query = db.query(TranslationMemory).filter(
        TranslationMemory.source_locale == source_locale
    )
    
    if target_locale:
        query = query.filter(TranslationMemory.target_locale == target_locale)
    
    if search:
        query = query.filter(
            TranslationMemory.source_text.ilike(f"%{search}%")
        )
    
    entries = query.offset(skip).limit(limit).all()
    return {"entries": entries, "total": query.count()}

@router.post("/translation-memory", response_model=TranslationMemorySchema)
async def add_translation_memory(
    tm_entry: TranslationMemorySchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Add entry to translation memory (Admin only)"""
    db_entry = TranslationMemory(**tm_entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("/glossary")
async def get_glossary(
    search: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get glossary entries"""
    query = db.query(Glossary)
    
    if search:
        query = query.filter(Glossary.term.ilike(f"%{search}%"))
    
    if category:
        query = query.filter(Glossary.category == category)
    
    entries = query.offset(skip).limit(limit).all()
    return {"entries": entries, "total": query.count()}

@router.post("/glossary", response_model=GlossarySchema)
async def add_glossary_entry(
    glossary_entry: GlossarySchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Add entry to glossary (Admin only)"""
    db_entry = Glossary(**glossary_entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.put("/glossary/{entry_id}", response_model=GlossarySchema)
async def update_glossary_entry(
    entry_id: int,
    glossary_update: GlossarySchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update glossary entry (Admin only)"""
    entry = db.query(Glossary).filter(Glossary.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Glossary entry not found")
    
    update_data = glossary_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/glossary/{entry_id}")
async def delete_glossary_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete glossary entry (Admin only)"""
    entry = db.query(Glossary).filter(Glossary.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Glossary entry not found")
    
    db.delete(entry)
    db.commit()
    return {"message": "Glossary entry deleted successfully"}

@router.get("/chat-history/{session_id}")
async def get_chat_history(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get chat history for a session"""
    chat_session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return {
        "session_id": session_id,
        "context": chat_session.context,
        "created_at": chat_session.created_at,
        "last_activity": chat_session.last_activity
    }

@router.delete("/chat-history/{session_id}")
async def clear_chat_history(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Clear chat history for a session"""
    chat_session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    db.delete(chat_session)
    db.commit()
    return {"message": "Chat history cleared successfully"}