from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from database import get_db
from models import (
    User, UserRole, Project, TranslationTask, TaskStatus, 
    Invoice, InvoiceStatus, Translator, TranslationMemory, AITranslation
)
from schemas import ProjectReport, TranslatorReport, FinancialReport, LocaleStats
from auth import get_current_active_user, require_finance_or_admin, require_product_or_admin

router = APIRouter()

@router.get("/locale-status")
async def get_locale_status_report(
    project_id: Optional[int] = None,
    time_period: str = Query("overall", regex="^(this_month|last_month|overall)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed statistics for each locale"""
    # Calculate date filters based on time period
    now = datetime.now()
    start_date = None
    end_date = None
    
    if time_period == "this_month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif time_period == "last_month":
        if now.month == 1:
            start_date = now.replace(year=now.year-1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            start_date = now.replace(month=now.month-1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Build query
    query = db.query(TranslationTask)
    
    if project_id:
        query = query.filter(TranslationTask.project_id == project_id)
        # Check permissions for specific project
        if current_user.role == UserRole.PRODUCT:
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project or project.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to view this project")
    
    if start_date and end_date:
        query = query.filter(
            and_(
                TranslationTask.created_at >= start_date,
                TranslationTask.created_at <= end_date
            )
        )
    
    # Role-based filtering
    if current_user.role == UserRole.TRANSLATOR and current_user.translator_profile:
        query = query.filter(TranslationTask.translator_id == current_user.translator_profile.id)
    elif current_user.role == UserRole.PRODUCT and not project_id:
        query = query.join(Project).filter(Project.created_by_id == current_user.id)
    
    tasks = query.all()
    
    # Group by locale
    locale_stats = {}
    for task in tasks:
        locale = task.locale
        if locale not in locale_stats:
            locale_stats[locale] = {
                "total_strings": 0,
                "translated_strings": 0,
                "warnings": 0,
                "errors": 0,
                "total_cost": 0,
                "tm_savings": 0,
                "ai_savings": 0
            }
        
        stats = task.translation_stats or {}
        locale_stats[locale]["total_strings"] += stats.get("total", task.word_count)
        locale_stats[locale]["translated_strings"] += stats.get("translated", 0)
        locale_stats[locale]["warnings"] += stats.get("warnings", 0)
        locale_stats[locale]["errors"] += stats.get("errors", 0)
        locale_stats[locale]["total_cost"] += task.actual_cost or task.estimated_cost
        locale_stats[locale]["tm_savings"] += task.tm_savings or 0
        locale_stats[locale]["ai_savings"] += task.ai_savings or 0
    
    # Convert to response format
    result = []
    for locale, stats in locale_stats.items():
        completion_percentage = 0
        if stats["total_strings"] > 0:
            completion_percentage = (stats["translated_strings"] / stats["total_strings"]) * 100
        
        result.append(LocaleStats(
            locale=locale,
            total_strings=stats["total_strings"],
            translated_strings=stats["translated_strings"],
            warnings=stats["warnings"],
            errors=stats["errors"],
            completion_percentage=completion_percentage,
            cost=stats["total_cost"],
            tm_savings=stats["tm_savings"],
            ai_savings=stats["ai_savings"]
        ))
    
    return {
        "time_period": time_period,
        "project_id": project_id,
        "locale_stats": result,
        "total_locales": len(result)
    }

@router.get("/project-summary")
async def get_project_summary_report(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive project summary with locale breakdown"""
    query = db.query(Project)
    
    if project_id:
        query = query.filter(Project.id == project_id)
    
    # Role-based filtering
    if current_user.role == UserRole.PRODUCT:
        query = query.filter(Project.created_by_id == current_user.id)
    elif current_user.role == UserRole.TRANSLATOR and current_user.translator_profile:
        query = query.join(TranslationTask).filter(
            TranslationTask.translator_id == current_user.translator_profile.id
        )
    
    projects = query.all()
    
    project_reports = []
    for project in projects:
        # Get tasks for this project
        tasks = db.query(TranslationTask).filter(TranslationTask.project_id == project.id).all()
        
        locale_stats = {}
        total_cost = 0
        total_savings = 0
        total_strings = 0
        translated_strings = 0
        
        for task in tasks:
            locale = task.locale
            if locale not in locale_stats:
                locale_stats[locale] = {
                    "total_strings": 0,
                    "translated_strings": 0,
                    "warnings": 0,
                    "errors": 0,
                    "cost": 0,
                    "tm_savings": 0,
                    "ai_savings": 0
                }
            
            stats = task.translation_stats or {}
            task_total = stats.get("total", task.word_count)
            task_translated = stats.get("translated", 0)
            task_cost = task.actual_cost or task.estimated_cost
            task_tm_savings = task.tm_savings or 0
            task_ai_savings = task.ai_savings or 0
            
            locale_stats[locale]["total_strings"] += task_total
            locale_stats[locale]["translated_strings"] += task_translated
            locale_stats[locale]["warnings"] += stats.get("warnings", 0)
            locale_stats[locale]["errors"] += stats.get("errors", 0)
            locale_stats[locale]["cost"] += task_cost
            locale_stats[locale]["tm_savings"] += task_tm_savings
            locale_stats[locale]["ai_savings"] += task_ai_savings
            
            total_cost += task_cost
            total_savings += task_tm_savings + task_ai_savings
            total_strings += task_total
            translated_strings += task_translated
        
        # Convert to LocaleStats objects
        locale_stats_list = []
        for locale, stats in locale_stats.items():
            completion_percentage = 0
            if stats["total_strings"] > 0:
                completion_percentage = (stats["translated_strings"] / stats["total_strings"]) * 100
            
            locale_stats_list.append(LocaleStats(
                locale=locale,
                total_strings=stats["total_strings"],
                translated_strings=stats["translated_strings"],
                warnings=stats["warnings"],
                errors=stats["errors"],
                completion_percentage=completion_percentage,
                cost=stats["cost"],
                tm_savings=stats["tm_savings"],
                ai_savings=stats["ai_savings"]
            ))
        
        # Calculate overall completion percentage
        overall_completion = 0
        if total_strings > 0:
            overall_completion = (translated_strings / total_strings) * 100
        
        project_reports.append(ProjectReport(
            project_id=project.id,
            project_name=project.name,
            locale_stats=locale_stats_list,
            total_cost=total_cost,
            total_savings=total_savings,
            completion_percentage=overall_completion
        ))
    
    return {
        "projects": project_reports,
        "total_projects": len(project_reports)
    }

@router.get("/translator-performance")
async def get_translator_performance_report(
    translator_id: Optional[int] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get translator performance metrics"""
    query = db.query(Translator)
    
    if translator_id:
        query = query.filter(Translator.id == translator_id)
    
    # Role-based filtering
    if current_user.role == UserRole.TRANSLATOR and current_user.translator_profile:
        query = query.filter(Translator.id == current_user.translator_profile.id)
    
    translators = query.all()
    
    translator_reports = []
    for translator in translators:
        # Get tasks for this translator
        task_query = db.query(TranslationTask).filter(TranslationTask.translator_id == translator.id)
        
        if year:
            task_query = task_query.filter(extract('year', TranslationTask.created_at) == year)
        if month:
            task_query = task_query.filter(extract('month', TranslationTask.created_at) == month)
        
        tasks = task_query.all()
        
        # Calculate metrics
        completed_tasks = len([t for t in tasks if t.status == TaskStatus.COMPLETED])
        pending_tasks = len([t for t in tasks if t.status in [TaskStatus.PENDING, TaskStatus.IN_PROGRESS]])
        
        # Get earnings from paid invoices
        invoice_query = db.query(func.sum(Invoice.total_amount)).filter(
            Invoice.translator_id == translator.id,
            Invoice.status == InvoiceStatus.PAID
        )
        
        if year:
            invoice_query = invoice_query.filter(extract('year', Invoice.paid_at) == year)
        if month:
            invoice_query = invoice_query.filter(extract('month', Invoice.paid_at) == month)
        
        total_earnings = invoice_query.scalar() or 0
        
        # Calculate average quality score (placeholder - would need quality metrics)
        average_quality_score = 4.5  # Placeholder
        
        translator_reports.append(TranslatorReport(
            translator_id=translator.id,
            translator_name=translator.user.full_name,
            total_earnings=total_earnings,
            completed_tasks=completed_tasks,
            pending_tasks=pending_tasks,
            average_quality_score=average_quality_score
        ))
    
    return {
        "translators": translator_reports,
        "period": {"year": year, "month": month}
    }

@router.get("/financial-summary")
async def get_financial_summary(
    year: int,
    month: Optional[int] = None,
    quarter: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_or_admin)
):
    """Get comprehensive financial report"""
    # Build date filters
    if quarter:
        start_month = (quarter - 1) * 3 + 1
        end_month = quarter * 3
        period_start = date(year, start_month, 1)
        if quarter == 4:
            period_end = date(year + 1, 1, 1)
        else:
            period_end = date(year, end_month + 1, 1)
    elif month:
        period_start = date(year, month, 1)
        if month == 12:
            period_end = date(year + 1, 1, 1)
        else:
            period_end = date(year, month + 1, 1)
    else:
        period_start = date(year, 1, 1)
        period_end = date(year + 1, 1, 1)
    
    # Get paid invoices for the period
    invoices = db.query(Invoice).filter(
        and_(
            Invoice.status == InvoiceStatus.PAID,
            Invoice.paid_at >= period_start,
            Invoice.paid_at < period_end
        )
    ).all()
    
    total_spending = sum(invoice.total_amount for invoice in invoices)
    
    # Spending by project
    spending_by_project = {}
    for invoice in invoices:
        project_name = invoice.project.name
        spending_by_project[project_name] = spending_by_project.get(project_name, 0) + invoice.total_amount
    
    # Spending by translator
    spending_by_translator = {}
    for invoice in invoices:
        translator_name = invoice.translator.user.full_name
        spending_by_translator[translator_name] = spending_by_translator.get(translator_name, 0) + invoice.total_amount
    
    # Spending by locale (from tasks)
    spending_by_locale = {}
    for invoice in invoices:
        tasks = db.query(TranslationTask).filter(
            and_(
                TranslationTask.translator_id == invoice.translator_id,
                TranslationTask.project_id == invoice.project_id,
                TranslationTask.completed_at >= invoice.period_start,
                TranslationTask.completed_at < invoice.period_end
            )
        ).all()
        
        for task in tasks:
            locale = task.locale
            task_cost = task.actual_cost or task.estimated_cost
            spending_by_locale[locale] = spending_by_locale.get(locale, 0) + task_cost
    
    # Calculate projected spending for next period
    # Simple projection based on current pending tasks
    pending_tasks = db.query(TranslationTask).filter(
        TranslationTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
    ).all()
    projected_spending = sum(task.estimated_cost for task in pending_tasks)
    
    return FinancialReport(
        period_start=period_start,
        period_end=period_end,
        total_spending=total_spending,
        spending_by_project=spending_by_project,
        spending_by_translator=spending_by_translator,
        spending_by_locale=spending_by_locale,
        projected_spending=projected_spending
    )

@router.get("/cost-savings")
async def get_cost_savings_report(
    year: Optional[int] = None,
    month: Optional[int] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed cost savings from Translation Memory and AI"""
    query = db.query(TranslationTask)
    
    if project_id:
        query = query.filter(TranslationTask.project_id == project_id)
    if year:
        query = query.filter(extract('year', TranslationTask.created_at) == year)
    if month:
        query = query.filter(extract('month', TranslationTask.created_at) == month)
    
    # Role-based filtering
    if current_user.role == UserRole.PRODUCT:
        query = query.join(Project).filter(Project.created_by_id == current_user.id)
    elif current_user.role == UserRole.TRANSLATOR and current_user.translator_profile:
        query = query.filter(TranslationTask.translator_id == current_user.translator_profile.id)
    
    tasks = query.all()
    
    total_tm_savings = sum(task.tm_savings or 0 for task in tasks)
    total_ai_savings = sum(task.ai_savings or 0 for task in tasks)
    total_savings = total_tm_savings + total_ai_savings
    
    # Breakdown by project
    savings_by_project = {}
    for task in tasks:
        project_name = task.project.name
        if project_name not in savings_by_project:
            savings_by_project[project_name] = {
                "tm_savings": 0,
                "ai_savings": 0,
                "total_savings": 0
            }
        
        tm_savings = task.tm_savings or 0
        ai_savings = task.ai_savings or 0
        
        savings_by_project[project_name]["tm_savings"] += tm_savings
        savings_by_project[project_name]["ai_savings"] += ai_savings
        savings_by_project[project_name]["total_savings"] += tm_savings + ai_savings
    
    return {
        "period": {"year": year, "month": month},
        "project_id": project_id,
        "total_tm_savings": total_tm_savings,
        "total_ai_savings": total_ai_savings,
        "total_savings": total_savings,
        "savings_by_project": savings_by_project,
        "tasks_analyzed": len(tasks)
    }

@router.get("/word-count-verification")
async def get_word_count_verification(
    year: int,
    month: int,
    translator_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_or_admin)
):
    """Get word count verification for invoice confirmation"""
    # Get completed tasks for the period
    period_start = date(year, month, 1)
    if month == 12:
        period_end = date(year + 1, 1, 1)
    else:
        period_end = date(year, month + 1, 1)
    
    query = db.query(TranslationTask).filter(
        and_(
            TranslationTask.status == TaskStatus.COMPLETED,
            TranslationTask.completed_at >= period_start,
            TranslationTask.completed_at < period_end
        )
    )
    
    if translator_id:
        query = query.filter(TranslationTask.translator_id == translator_id)
    
    tasks = query.all()
    
    # Group by translator
    verification_data = {}
    total_word_count = 0
    
    for task in tasks:
        translator_name = task.translator.user.full_name
        if translator_name not in verification_data:
            verification_data[translator_name] = {
                "translator_id": task.translator_id,
                "total_words": 0,
                "total_cost": 0,
                "tasks": []
            }
        
        verification_data[translator_name]["total_words"] += task.word_count
        verification_data[translator_name]["total_cost"] += task.actual_cost or task.estimated_cost
        verification_data[translator_name]["tasks"].append({
            "task_id": task.id,
            "project": task.project.name,
            "locale": task.locale,
            "word_count": task.word_count,
            "cost": task.actual_cost or task.estimated_cost,
            "completed_at": task.completed_at
        })
        total_word_count += task.word_count
    
    return {
        "year": year,
        "month": month,
        "total_word_count": total_word_count,
        "verification_data": verification_data,
        "total_translators": len(verification_data)
    }