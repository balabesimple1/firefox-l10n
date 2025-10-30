from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Translator, User, UserRole
from schemas import Translator as TranslatorSchema, TranslatorCreate, TranslatorUpdate
from auth import get_current_active_user, require_admin

router = APIRouter()

@router.post("/", response_model=TranslatorSchema)
async def create_translator(
    translator: TranslatorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new translator profile"""
    # Check if user exists and doesn't already have a translator profile
    user = db.query(User).filter(User.id == translator.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_translator = db.query(Translator).filter(Translator.user_id == translator.user_id).first()
    if existing_translator:
        raise HTTPException(status_code=400, detail="User already has a translator profile")
    
    db_translator = Translator(**translator.dict())
    db.add(db_translator)
    db.commit()
    db.refresh(db_translator)
    return db_translator

@router.get("/", response_model=List[TranslatorSchema])
async def list_translators(
    skip: int = 0,
    limit: int = 100,
    locale: str = None,
    available_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all translators with optional filtering"""
    query = db.query(Translator)
    
    if available_only:
        query = query.filter(Translator.is_available == True)
    
    if locale:
        # Filter by translators who specialize in the given locale
        query = query.filter(Translator.specializations.contains([locale]))
    
    translators = query.offset(skip).limit(limit).all()
    return translators

@router.get("/{translator_id}", response_model=TranslatorSchema)
async def get_translator(
    translator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific translator"""
    translator = db.query(Translator).filter(Translator.id == translator_id).first()
    if not translator:
        raise HTTPException(status_code=404, detail="Translator not found")
    
    # Translators can only view their own profile unless admin
    if (current_user.role == UserRole.TRANSLATOR and 
        current_user.translator_profile and
        current_user.translator_profile.id != translator_id and
        current_user.role != UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not authorized to view this translator")
    
    return translator

@router.put("/{translator_id}", response_model=TranslatorSchema)
async def update_translator(
    translator_id: int,
    translator_update: TranslatorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a translator profile"""
    translator = db.query(Translator).filter(Translator.id == translator_id).first()
    if not translator:
        raise HTTPException(status_code=404, detail="Translator not found")
    
    # Check permissions - translators can update their own profile, admins can update any
    if (current_user.role == UserRole.TRANSLATOR and 
        current_user.translator_profile and
        current_user.translator_profile.id != translator_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this translator")
    elif current_user.role not in [UserRole.ADMIN, UserRole.TRANSLATOR]:
        raise HTTPException(status_code=403, detail="Not authorized to update translators")
    
    # Update fields
    update_data = translator_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(translator, field, value)
    
    db.commit()
    db.refresh(translator)
    return translator

@router.post("/{translator_id}/rates")
async def update_translator_rates(
    translator_id: int,
    rates: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update translator rates per locale (admin only)"""
    translator = db.query(Translator).filter(Translator.id == translator_id).first()
    if not translator:
        raise HTTPException(status_code=404, detail="Translator not found")
    
    translator.rates = rates
    db.commit()
    db.refresh(translator)
    return {"message": "Translator rates updated successfully", "rates": rates}

@router.get("/{translator_id}/tasks")
async def get_translator_tasks(
    translator_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get tasks assigned to a translator"""
    translator = db.query(Translator).filter(Translator.id == translator_id).first()
    if not translator:
        raise HTTPException(status_code=404, detail="Translator not found")
    
    # Check permissions
    if (current_user.role == UserRole.TRANSLATOR and 
        current_user.translator_profile and
        current_user.translator_profile.id != translator_id and
        current_user.role != UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not authorized to view these tasks")
    
    from models import TranslationTask
    tasks = db.query(TranslationTask).filter(
        TranslationTask.translator_id == translator_id
    ).offset(skip).limit(limit).all()
    
    return tasks

@router.get("/{translator_id}/earnings")
async def get_translator_earnings(
    translator_id: int,
    year: int = None,
    month: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get translator earnings summary"""
    translator = db.query(Translator).filter(Translator.id == translator_id).first()
    if not translator:
        raise HTTPException(status_code=404, detail="Translator not found")
    
    # Check permissions
    if (current_user.role == UserRole.TRANSLATOR and 
        current_user.translator_profile and
        current_user.translator_profile.id != translator_id and
        current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]):
        raise HTTPException(status_code=403, detail="Not authorized to view earnings")
    
    from models import Invoice, InvoiceStatus
    from sqlalchemy import func, extract
    
    query = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.translator_id == translator_id,
        Invoice.status == InvoiceStatus.PAID
    )
    
    if year:
        query = query.filter(extract('year', Invoice.paid_at) == year)
    if month:
        query = query.filter(extract('month', Invoice.paid_at) == month)
    
    total_earnings = query.scalar() or 0
    
    return {
        "translator_id": translator_id,
        "total_earnings": total_earnings,
        "year": year,
        "month": month
    }

@router.get("/recommendations/{locale}")
async def get_translator_recommendations(
    locale: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get recommended translators for a specific locale"""
    # Find translators who specialize in the locale and are available
    translators = db.query(Translator).filter(
        Translator.specializations.contains([locale]),
        Translator.is_available == True
    ).all()
    
    # Sort by some criteria (e.g., rates, past performance)
    # For now, just return available translators
    recommendations = []
    for translator in translators:
        rate = translator.rates.get(locale, 0) if translator.rates else 0
        recommendations.append({
            "translator_id": translator.id,
            "name": translator.user.full_name,
            "rate_per_word": rate,
            "specializations": translator.specializations,
            "bio": translator.bio
        })
    
    # Sort by rate (ascending)
    recommendations.sort(key=lambda x: x["rate_per_word"])
    
    return {
        "locale": locale,
        "recommendations": recommendations
    }