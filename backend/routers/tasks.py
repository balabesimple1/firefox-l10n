from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
import os
from database import get_db
from models import TranslationTask, User, UserRole, TaskStatus, Project, Translator
from schemas import (
    TranslationTask as TranslationTaskSchema, 
    TranslationTaskCreate, 
    TranslationTaskUpdate
)
from auth import get_current_active_user, require_product_or_admin, require_translator_or_admin

router = APIRouter()

@router.post("/", response_model=TranslationTaskSchema)
async def create_translation_task(
    task: TranslationTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_product_or_admin)
):
    """Create a new translation task"""
    # Verify project exists
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify translator exists
    translator = db.query(Translator).filter(Translator.id == task.translator_id).first()
    if not translator:
        raise HTTPException(status_code=404, detail="Translator not found")
    
    # Check if translator specializes in the locale
    if task.locale not in translator.specializations:
        raise HTTPException(
            status_code=400, 
            detail=f"Translator does not specialize in locale: {task.locale}"
        )
    
    # Calculate estimated cost based on translator rates
    rate = translator.rates.get(task.locale, 0) if translator.rates else 0
    estimated_cost = task.word_count * rate
    
    db_task = TranslationTask(
        **task.dict(),
        estimated_cost=estimated_cost
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/", response_model=List[TranslationTaskSchema])
async def list_translation_tasks(
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[int] = None,
    translator_id: Optional[int] = None,
    locale: Optional[str] = None,
    status: Optional[TaskStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List translation tasks with filtering"""
    query = db.query(TranslationTask)
    
    # Apply filters
    if project_id:
        query = query.filter(TranslationTask.project_id == project_id)
    if translator_id:
        query = query.filter(TranslationTask.translator_id == translator_id)
    if locale:
        query = query.filter(TranslationTask.locale == locale)
    if status:
        query = query.filter(TranslationTask.status == status)
    
    # Role-based filtering
    if current_user.role == UserRole.TRANSLATOR and current_user.translator_profile:
        query = query.filter(TranslationTask.translator_id == current_user.translator_profile.id)
    elif current_user.role == UserRole.PRODUCT:
        # Product team can see tasks for their projects
        query = query.join(Project).filter(Project.created_by_id == current_user.id)
    
    tasks = query.offset(skip).limit(limit).all()
    return tasks

@router.get("/{task_id}", response_model=TranslationTaskSchema)
async def get_translation_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific translation task"""
    task = db.query(TranslationTask).filter(TranslationTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Translation task not found")
    
    # Check permissions
    if current_user.role == UserRole.TRANSLATOR:
        if not current_user.translator_profile or current_user.translator_profile.id != task.translator_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this task")
    elif current_user.role == UserRole.PRODUCT:
        project = db.query(Project).filter(Project.id == task.project_id).first()
        if project.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    return task

@router.put("/{task_id}", response_model=TranslationTaskSchema)
async def update_translation_task(
    task_id: int,
    task_update: TranslationTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a translation task"""
    task = db.query(TranslationTask).filter(TranslationTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Translation task not found")
    
    # Check permissions
    if current_user.role == UserRole.TRANSLATOR:
        if not current_user.translator_profile or current_user.translator_profile.id != task.translator_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this task")
    elif current_user.role == UserRole.PRODUCT:
        project = db.query(Project).filter(Project.id == task.project_id).first()
        if project.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this task")
    elif current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    # Update fields
    update_data = task_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Set completed_at if status is completed
    if task_update.status == TaskStatus.COMPLETED and not task.completed_at:
        task.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task)
    return task

@router.post("/{task_id}/assign")
async def assign_translator(
    task_id: int,
    translator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_product_or_admin)
):
    """Assign or reassign a translator to a task"""
    task = db.query(TranslationTask).filter(TranslationTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Translation task not found")
    
    translator = db.query(Translator).filter(Translator.id == translator_id).first()
    if not translator:
        raise HTTPException(status_code=404, detail="Translator not found")
    
    # Check if translator specializes in the locale
    if task.locale not in translator.specializations:
        raise HTTPException(
            status_code=400, 
            detail=f"Translator does not specialize in locale: {task.locale}"
        )
    
    # Update task assignment
    old_translator_id = task.translator_id
    task.translator_id = translator_id
    
    # Recalculate estimated cost
    rate = translator.rates.get(task.locale, 0) if translator.rates else 0
    task.estimated_cost = task.word_count * rate
    
    db.commit()
    db.refresh(task)
    
    return {
        "message": "Translator assigned successfully",
        "old_translator_id": old_translator_id,
        "new_translator_id": translator_id,
        "new_estimated_cost": task.estimated_cost
    }

@router.post("/{task_id}/upload")
async def upload_translation_files(
    task_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_translator_or_admin)
):
    """Upload translated files for a task"""
    task = db.query(TranslationTask).filter(TranslationTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Translation task not found")
    
    # Check permissions
    if (current_user.role == UserRole.TRANSLATOR and 
        current_user.translator_profile and
        current_user.translator_profile.id != task.translator_id):
        raise HTTPException(status_code=403, detail="Not authorized to upload files for this task")
    
    # Create upload directory
    upload_dir = f"uploads/tasks/{task_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    uploaded_files = []
    for file in files:
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        uploaded_files.append(file_path)
    
    # Update task with uploaded files
    task.target_files = uploaded_files
    task.status = TaskStatus.REVIEW
    
    db.commit()
    db.refresh(task)
    
    return {
        "message": "Files uploaded successfully",
        "uploaded_files": uploaded_files,
        "task_status": task.status
    }

@router.get("/{task_id}/download")
async def download_source_files(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get download links for source files"""
    task = db.query(TranslationTask).filter(TranslationTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Translation task not found")
    
    # Check permissions
    if (current_user.role == UserRole.TRANSLATOR and 
        current_user.translator_profile and
        current_user.translator_profile.id != task.translator_id):
        raise HTTPException(status_code=403, detail="Not authorized to download files for this task")
    
    return {
        "task_id": task_id,
        "source_files": task.source_files,
        "locale": task.locale,
        "project_id": task.project_id
    }

@router.post("/{task_id}/estimate")
async def submit_cost_estimate(
    task_id: int,
    estimated_cost: float,
    estimated_hours: float,
    notes: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_translator_or_admin)
):
    """Submit cost and effort estimation for a task"""
    task = db.query(TranslationTask).filter(TranslationTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Translation task not found")
    
    # Check permissions
    if (current_user.role == UserRole.TRANSLATOR and 
        current_user.translator_profile and
        current_user.translator_profile.id != task.translator_id):
        raise HTTPException(status_code=403, detail="Not authorized to submit estimate for this task")
    
    # Update task with estimates
    task.estimated_cost = estimated_cost
    task.estimated_hours = estimated_hours
    
    db.commit()
    db.refresh(task)
    
    return {
        "message": "Cost estimate submitted successfully",
        "estimated_cost": estimated_cost,
        "estimated_hours": estimated_hours,
        "notes": notes
    }

@router.get("/bulk-download/{locale}")
async def bulk_download_by_locale(
    locale: str,
    project_ids: Optional[List[int]] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_translator_or_admin)
):
    """Bulk download translation resources for a locale"""
    query = db.query(TranslationTask).filter(TranslationTask.locale == locale)
    
    if project_ids:
        query = query.filter(TranslationTask.project_id.in_(project_ids))
    
    # If translator, only their assigned tasks
    if (current_user.role == UserRole.TRANSLATOR and 
        current_user.translator_profile):
        query = query.filter(TranslationTask.translator_id == current_user.translator_profile.id)
    
    tasks = query.all()
    
    # Collect all source files
    all_files = []
    for task in tasks:
        all_files.extend(task.source_files)
    
    return {
        "locale": locale,
        "total_tasks": len(tasks),
        "source_files": list(set(all_files)),  # Remove duplicates
        "download_url": f"/api/tasks/download-archive/{locale}"
    }