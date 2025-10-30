#!/usr/bin/env python3
"""
Setup script for the Localization Workflow Management System
This script initializes the database and creates demo users for testing.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy.orm import Session
from backend.database import engine, SessionLocal, Base
from backend.models import (
    User, UserRole, Translator, Project, ProjectStatus, 
    TranslationTask, TaskStatus, Invoice, InvoiceStatus
)
from backend.auth import get_password_hash

def create_demo_users(db: Session):
    """Create demo users for each role"""
    demo_users = [
        {
            'email': 'admin@example.com',
            'username': 'admin',
            'full_name': 'System Administrator',
            'password': 'admin123',
            'role': UserRole.ADMIN
        },
        {
            'email': 'product@example.com',
            'username': 'product',
            'full_name': 'Product Manager',
            'password': 'product123',
            'role': UserRole.PRODUCT
        },
        {
            'email': 'finance@example.com',
            'username': 'finance',
            'full_name': 'Finance Manager',
            'password': 'finance123',
            'role': UserRole.FINANCE
        },
        {
            'email': 'translator@example.com',
            'username': 'translator',
            'full_name': 'John Translator',
            'password': 'translator123',
            'role': UserRole.TRANSLATOR
        },
        {
            'email': 'translator2@example.com',
            'username': 'translator2',
            'full_name': 'Marie Traducteur',
            'password': 'translator123',
            'role': UserRole.TRANSLATOR
        }
    ]
    
    created_users = []
    for user_data in demo_users:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data['email']).first()
        if existing_user:
            print(f"User {user_data['email']} already exists, skipping...")
            created_users.append(existing_user)
            continue
        
        user = User(
            email=user_data['email'],
            username=user_data['username'],
            full_name=user_data['full_name'],
            hashed_password=get_password_hash(user_data['password']),
            role=user_data['role']
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        created_users.append(user)
        print(f"Created user: {user.email} ({user.role.value})")
    
    return created_users

def create_demo_translators(db: Session, users: list):
    """Create translator profiles for translator users"""
    translator_users = [user for user in users if user.role == UserRole.TRANSLATOR]
    
    translator_data = [
        {
            'specializations': ['fr-FR', 'de-DE', 'es-ES'],
            'rates': {'fr-FR': 0.12, 'de-DE': 0.15, 'es-ES': 0.10},
            'bio': 'Experienced translator specializing in European languages with 10+ years of experience in software localization.'
        },
        {
            'specializations': ['ja-JP', 'ko-KR', 'zh-CN'],
            'rates': {'ja-JP': 0.20, 'ko-KR': 0.18, 'zh-CN': 0.16},
            'bio': 'Native Japanese speaker with expertise in Asian languages and technical translation.'
        }
    ]
    
    created_translators = []
    for i, user in enumerate(translator_users):
        if i < len(translator_data):
            data = translator_data[i]
            
            # Check if translator profile already exists
            existing_translator = db.query(Translator).filter(Translator.user_id == user.id).first()
            if existing_translator:
                print(f"Translator profile for {user.email} already exists, skipping...")
                created_translators.append(existing_translator)
                continue
            
            translator = Translator(
                user_id=user.id,
                specializations=data['specializations'],
                rates=data['rates'],
                bio=data['bio'],
                is_available=True
            )
            db.add(translator)
            db.commit()
            db.refresh(translator)
            created_translators.append(translator)
            print(f"Created translator profile for: {user.full_name}")
    
    return created_translators

def create_demo_projects(db: Session, users: list):
    """Create demo projects"""
    product_manager = next((user for user in users if user.role == UserRole.PRODUCT), None)
    if not product_manager:
        print("No product manager found, skipping project creation...")
        return []
    
    demo_projects = [
        {
            'name': 'Firefox Browser',
            'description': 'Main Firefox browser localization project',
            'repository_url': 'https://github.com/mozilla-firefox/firefox',
            'target_locales': ['fr-FR', 'de-DE', 'es-ES', 'ja-JP', 'zh-CN'],
            'auto_approval_threshold': 2000.0,
            'status': ProjectStatus.ACTIVE
        },
        {
            'name': 'Firefox Mobile',
            'description': 'Firefox mobile application localization',
            'repository_url': 'https://github.com/mozilla-firefox/firefox-mobile',
            'target_locales': ['fr-FR', 'de-DE', 'ja-JP'],
            'auto_approval_threshold': 1500.0,
            'status': ProjectStatus.ACTIVE
        },
        {
            'name': 'Developer Tools',
            'description': 'Firefox Developer Tools localization',
            'repository_url': 'https://github.com/mozilla-firefox/devtools',
            'target_locales': ['fr-FR', 'de-DE', 'es-ES'],
            'auto_approval_threshold': 1000.0,
            'status': ProjectStatus.DRAFT
        }
    ]
    
    created_projects = []
    for project_data in demo_projects:
        # Check if project already exists
        existing_project = db.query(Project).filter(Project.name == project_data['name']).first()
        if existing_project:
            print(f"Project {project_data['name']} already exists, skipping...")
            created_projects.append(existing_project)
            continue
        
        project = Project(
            name=project_data['name'],
            description=project_data['description'],
            repository_url=project_data['repository_url'],
            target_locales=project_data['target_locales'],
            auto_approval_threshold=project_data['auto_approval_threshold'],
            status=project_data['status'],
            created_by_id=product_manager.id
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        created_projects.append(project)
        print(f"Created project: {project.name}")
    
    return created_projects

def create_demo_tasks(db: Session, projects: list, translators: list):
    """Create demo translation tasks"""
    if not projects or not translators:
        print("No projects or translators found, skipping task creation...")
        return []
    
    created_tasks = []
    for project in projects:
        for locale in project.target_locales[:2]:  # Create tasks for first 2 locales
            # Find a suitable translator
            translator = None
            for t in translators:
                if locale in t.specializations:
                    translator = t
                    break
            
            if not translator:
                continue
            
            # Check if task already exists
            existing_task = db.query(TranslationTask).filter(
                TranslationTask.project_id == project.id,
                TranslationTask.locale == locale
            ).first()
            if existing_task:
                print(f"Task for {project.name} - {locale} already exists, skipping...")
                created_tasks.append(existing_task)
                continue
            
            rate = translator.rates.get(locale, 0.10)
            word_count = 1000 + (len(project.name) * 100)  # Simulate word count
            
            task = TranslationTask(
                project_id=project.id,
                translator_id=translator.id,
                locale=locale,
                source_files=[f"browser/{locale}/browser.ftl", f"browser/{locale}/menu.ftl"],
                word_count=word_count,
                estimated_cost=word_count * rate,
                estimated_hours=word_count / 200,  # Assume 200 words per hour
                status=TaskStatus.IN_PROGRESS,
                deadline=datetime.utcnow() + timedelta(days=14),
                translation_stats={
                    'total': word_count,
                    'translated': int(word_count * 0.7),  # 70% complete
                    'warnings': 5,
                    'errors': 2
                },
                tm_savings=word_count * rate * 0.15,  # 15% savings from TM
                ai_savings=word_count * rate * 0.10   # 10% savings from AI
            )
            db.add(task)
            db.commit()
            db.refresh(task)
            created_tasks.append(task)
            print(f"Created task: {project.name} - {locale}")
    
    return created_tasks

def main():
    """Main setup function"""
    print("Setting up Localization Workflow Management System...")
    
    # Create database tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Create demo data
        print("\nCreating demo users...")
        users = create_demo_users(db)
        
        print("\nCreating translator profiles...")
        translators = create_demo_translators(db, users)
        
        print("\nCreating demo projects...")
        projects = create_demo_projects(db, users)
        
        print("\nCreating demo tasks...")
        tasks = create_demo_tasks(db, projects, translators)
        
        print(f"\nSetup completed successfully!")
        print(f"Created {len(users)} users, {len(translators)} translators, {len(projects)} projects, {len(tasks)} tasks")
        
        print("\nDemo Login Credentials:")
        print("Admin: admin@example.com / admin123")
        print("Product Manager: product@example.com / product123")
        print("Finance Manager: finance@example.com / finance123")
        print("Translator 1: translator@example.com / translator123")
        print("Translator 2: translator2@example.com / translator123")
        
    except Exception as e:
        print(f"Error during setup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()