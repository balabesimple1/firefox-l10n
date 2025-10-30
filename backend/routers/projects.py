from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Project, User, UserRole, ProjectStatus
from schemas import Project as ProjectSchema, ProjectCreate, ProjectUpdate
from auth import get_current_active_user, require_product_or_admin, require_admin

router = APIRouter()

@router.post("/", response_model=ProjectSchema)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_product_or_admin)
):
    """Create a new localization project"""
    db_project = Project(
        **project.dict(),
        created_by_id=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[ProjectSchema])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    status: ProjectStatus = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all projects (filtered by user role)"""
    query = db.query(Project)
    
    # Filter by status if provided
    if status:
        query = query.filter(Project.status == status)
    
    # Role-based filtering
    if current_user.role == UserRole.PRODUCT:
        query = query.filter(Project.created_by_id == current_user.id)
    elif current_user.role == UserRole.TRANSLATOR:
        # Translators can only see projects they're assigned to
        from models import TranslationTask
        query = query.join(TranslationTask).filter(
            TranslationTask.translator_id == current_user.translator_profile.id
        )
    
    projects = query.offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=ProjectSchema)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if (current_user.role == UserRole.PRODUCT and 
        project.created_by_id != current_user.id and
        current_user.role != UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not authorized to view this project")
    
    return project

@router.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_product_or_admin)
):
    """Update a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if (current_user.role == UserRole.PRODUCT and 
        project.created_by_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this project")
    
    # Update fields
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a project (admin only)"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.post("/{project_id}/locales")
async def update_project_locales(
    project_id: int,
    locales: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_product_or_admin)
):
    """Update target locales for a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if (current_user.role == UserRole.PRODUCT and 
        project.created_by_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this project")
    
    project.target_locales = locales
    db.commit()
    db.refresh(project)
    return {"message": "Project locales updated successfully", "locales": locales}

@router.get("/{project_id}/cost-estimate")
async def get_project_cost_estimate(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get cost estimate and delivery date for a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Calculate estimates based on tasks
    from models import TranslationTask
    tasks = db.query(TranslationTask).filter(TranslationTask.project_id == project_id).all()
    
    total_estimated_cost = sum(task.estimated_cost for task in tasks)
    total_word_count = sum(task.word_count for task in tasks)
    
    # Estimate delivery date (assuming 500 words per day per translator)
    import datetime
    estimated_days = max(1, total_word_count // 500) if total_word_count > 0 else 1
    estimated_delivery = datetime.datetime.now() + datetime.timedelta(days=estimated_days)
    
    return {
        "project_id": project_id,
        "estimated_cost": total_estimated_cost,
        "estimated_delivery_date": estimated_delivery,
        "total_word_count": total_word_count,
        "auto_approval": total_estimated_cost < project.auto_approval_threshold
    }