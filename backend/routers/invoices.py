from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import List, Optional
from datetime import datetime, date
from database import get_db
from models import Invoice, User, UserRole, InvoiceStatus, Translator, Project, TranslationTask
from schemas import Invoice as InvoiceSchema, InvoiceCreate, InvoiceUpdate
from auth import get_current_active_user, require_finance_or_admin, require_translator_or_admin

router = APIRouter()

def generate_invoice_number(db: Session, year: int, month: int) -> str:
    """Generate a unique invoice number"""
    count = db.query(Invoice).filter(
        extract('year', Invoice.created_at) == year,
        extract('month', Invoice.created_at) == month
    ).count()
    return f"INV-{year}{month:02d}-{count + 1:04d}"

@router.post("/", response_model=InvoiceSchema)
async def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_translator_or_admin)
):
    """Create a new invoice"""
    # Verify translator exists
    translator = db.query(Translator).filter(Translator.id == invoice.translator_id).first()
    if not translator:
        raise HTTPException(status_code=404, detail="Translator not found")
    
    # Check permissions - translators can only create their own invoices
    if (current_user.role == UserRole.TRANSLATOR and 
        current_user.translator_profile and
        current_user.translator_profile.id != invoice.translator_id):
        raise HTTPException(status_code=403, detail="Not authorized to create invoice for this translator")
    
    # Verify project exists
    project = db.query(Project).filter(Project.id == invoice.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Generate invoice number
    now = datetime.now()
    invoice_number = generate_invoice_number(db, now.year, now.month)
    
    db_invoice = Invoice(
        **invoice.dict(),
        invoice_number=invoice_number,
        submitted_at=datetime.utcnow()
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.get("/", response_model=List[InvoiceSchema])
async def list_invoices(
    skip: int = 0,
    limit: int = 100,
    translator_id: Optional[int] = None,
    project_id: Optional[int] = None,
    status: Optional[InvoiceStatus] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List invoices with filtering"""
    query = db.query(Invoice)
    
    # Apply filters
    if translator_id:
        query = query.filter(Invoice.translator_id == translator_id)
    if project_id:
        query = query.filter(Invoice.project_id == project_id)
    if status:
        query = query.filter(Invoice.status == status)
    if year:
        query = query.filter(extract('year', Invoice.created_at) == year)
    if month:
        query = query.filter(extract('month', Invoice.created_at) == month)
    
    # Role-based filtering
    if current_user.role == UserRole.TRANSLATOR and current_user.translator_profile:
        query = query.filter(Invoice.translator_id == current_user.translator_profile.id)
    elif current_user.role == UserRole.PRODUCT:
        # Product team can see invoices for their projects
        query = query.join(Project).filter(Project.created_by_id == current_user.id)
    
    invoices = query.offset(skip).limit(limit).all()
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceSchema)
async def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check permissions
    if current_user.role == UserRole.TRANSLATOR:
        if not current_user.translator_profile or current_user.translator_profile.id != invoice.translator_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this invoice")
    elif current_user.role == UserRole.PRODUCT:
        project = db.query(Project).filter(Project.id == invoice.project_id).first()
        if project.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this invoice")
    elif current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="Not authorized to view this invoice")
    
    return invoice

@router.put("/{invoice_id}", response_model=InvoiceSchema)
async def update_invoice(
    invoice_id: int,
    invoice_update: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check permissions based on what's being updated
    if invoice_update.status:
        # Only finance/admin can change status
        if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
            raise HTTPException(status_code=403, detail="Not authorized to change invoice status")
        
        # Set timestamps based on status
        if invoice_update.status == InvoiceStatus.APPROVED:
            invoice_update.approved_at = datetime.utcnow()
        elif invoice_update.status == InvoiceStatus.PAID:
            invoice_update.paid_at = datetime.utcnow()
    
    # Translators can only update their own invoices and only certain fields
    if current_user.role == UserRole.TRANSLATOR:
        if not current_user.translator_profile or current_user.translator_profile.id != invoice.translator_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this invoice")
        # Translators can only update notes if invoice is still draft
        if invoice.status != InvoiceStatus.DRAFT:
            raise HTTPException(status_code=400, detail="Cannot update submitted invoice")
    
    # Update fields
    update_data = invoice_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(invoice, field, value)
    
    db.commit()
    db.refresh(invoice)
    return invoice

@router.post("/{invoice_id}/approve")
async def approve_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_or_admin)
):
    """Approve an invoice (Finance/Admin only)"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status != InvoiceStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Only submitted invoices can be approved")
    
    invoice.status = InvoiceStatus.APPROVED
    invoice.approved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(invoice)
    
    return {"message": "Invoice approved successfully", "invoice_id": invoice_id}

@router.post("/{invoice_id}/reject")
async def reject_invoice(
    invoice_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_or_admin)
):
    """Reject an invoice (Finance/Admin only)"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status not in [InvoiceStatus.SUBMITTED, InvoiceStatus.APPROVED]:
        raise HTTPException(status_code=400, detail="Cannot reject invoice in current status")
    
    invoice.status = InvoiceStatus.REJECTED
    invoice.notes = f"{invoice.notes}\n\nRejection reason: {reason}" if invoice.notes else f"Rejection reason: {reason}"
    
    db.commit()
    db.refresh(invoice)
    
    return {"message": "Invoice rejected", "invoice_id": invoice_id, "reason": reason}

@router.post("/{invoice_id}/mark-paid")
async def mark_invoice_paid(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_or_admin)
):
    """Mark an invoice as paid (Finance/Admin only)"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status != InvoiceStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Only approved invoices can be marked as paid")
    
    invoice.status = InvoiceStatus.PAID
    invoice.paid_at = datetime.utcnow()
    
    db.commit()
    db.refresh(invoice)
    
    return {"message": "Invoice marked as paid", "invoice_id": invoice_id}

@router.post("/generate-monthly")
async def generate_monthly_invoice(
    translator_id: int,
    project_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_translator_or_admin)
):
    """Generate monthly invoice for a translator's work on a project"""
    # Verify translator exists
    translator = db.query(Translator).filter(Translator.id == translator_id).first()
    if not translator:
        raise HTTPException(status_code=404, detail="Translator not found")
    
    # Check permissions
    if (current_user.role == UserRole.TRANSLATOR and 
        current_user.translator_profile and
        current_user.translator_profile.id != translator_id):
        raise HTTPException(status_code=403, detail="Not authorized to generate invoice for this translator")
    
    # Get completed tasks for the period
    from datetime import date
    period_start = date(year, month, 1)
    if month == 12:
        period_end = date(year + 1, 1, 1)
    else:
        period_end = date(year, month + 1, 1)
    
    tasks = db.query(TranslationTask).filter(
        and_(
            TranslationTask.translator_id == translator_id,
            TranslationTask.project_id == project_id,
            TranslationTask.status == TaskStatus.COMPLETED,
            TranslationTask.completed_at >= period_start,
            TranslationTask.completed_at < period_end
        )
    ).all()
    
    if not tasks:
        raise HTTPException(status_code=404, detail="No completed tasks found for the period")
    
    # Calculate line items and total
    line_items = []
    total_amount = 0
    
    for task in tasks:
        amount = task.actual_cost or task.estimated_cost
        line_items.append({
            "task_id": task.id,
            "description": f"Translation for {task.locale} - {task.word_count} words",
            "quantity": task.word_count,
            "rate": amount / task.word_count if task.word_count > 0 else 0,
            "amount": amount
        })
        total_amount += amount
    
    # Generate invoice number
    invoice_number = generate_invoice_number(db, year, month)
    
    # Create invoice
    db_invoice = Invoice(
        invoice_number=invoice_number,
        translator_id=translator_id,
        project_id=project_id,
        period_start=period_start,
        period_end=period_end,
        total_amount=total_amount,
        line_items=line_items,
        status=InvoiceStatus.DRAFT
    )
    
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    
    return {
        "message": "Monthly invoice generated successfully",
        "invoice": db_invoice,
        "tasks_included": len(tasks)
    }

@router.get("/monthly-payouts/{year}/{month}")
async def get_monthly_payouts(
    year: int,
    month: int,
    translator_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_or_admin)
):
    """Get monthly payout report (Finance/Admin only)"""
    query = db.query(Invoice).filter(
        extract('year', Invoice.period_start) == year,
        extract('month', Invoice.period_start) == month,
        Invoice.status.in_([InvoiceStatus.APPROVED, InvoiceStatus.PAID])
    )
    
    if translator_id:
        query = query.filter(Invoice.translator_id == translator_id)
    
    invoices = query.all()
    
    # Group by translator
    payouts_by_translator = {}
    total_payout = 0
    
    for invoice in invoices:
        translator_name = invoice.translator.user.full_name
        project_name = invoice.project.name
        
        if translator_name not in payouts_by_translator:
            payouts_by_translator[translator_name] = {
                "translator_id": invoice.translator_id,
                "total_amount": 0,
                "projects": [],
                "invoices": []
            }
        
        payouts_by_translator[translator_name]["total_amount"] += invoice.total_amount
        payouts_by_translator[translator_name]["projects"].append(project_name)
        payouts_by_translator[translator_name]["invoices"].append({
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "amount": invoice.total_amount,
            "status": invoice.status,
            "project": project_name
        })
        total_payout += invoice.total_amount
    
    # Remove duplicate projects
    for translator_data in payouts_by_translator.values():
        translator_data["projects"] = list(set(translator_data["projects"]))
    
    return {
        "year": year,
        "month": month,
        "total_payout": total_payout,
        "payouts_by_translator": payouts_by_translator,
        "total_translators": len(payouts_by_translator)
    }

@router.get("/spending-by-product/{year}")
async def get_spending_by_product(
    year: int,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_or_admin)
):
    """Get spending breakdown by product/project"""
    query = db.query(Invoice).filter(
        extract('year', Invoice.period_start) == year,
        Invoice.status == InvoiceStatus.PAID
    )
    
    if month:
        query = query.filter(extract('month', Invoice.period_start) == month)
    
    invoices = query.all()
    
    spending_by_project = {}
    total_spending = 0
    
    for invoice in invoices:
        project_name = invoice.project.name
        if project_name not in spending_by_project:
            spending_by_project[project_name] = {
                "project_id": invoice.project_id,
                "total_amount": 0,
                "invoice_count": 0
            }
        
        spending_by_project[project_name]["total_amount"] += invoice.total_amount
        spending_by_project[project_name]["invoice_count"] += 1
        total_spending += invoice.total_amount
    
    return {
        "year": year,
        "month": month,
        "total_spending": total_spending,
        "spending_by_project": spending_by_project
    }