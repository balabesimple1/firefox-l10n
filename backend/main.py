from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
from database import get_db, engine, Base
from routers import auth, projects, translators, tasks, invoices, reports, ai_assistant
from models import User
from auth import get_current_user

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Localization Workflow Management System",
    description="Comprehensive system for managing Firefox localization workflows",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(translators.router, prefix="/api/translators", tags=["Translators"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(ai_assistant.router, prefix="/api/ai", tags=["AI Assistant"])

@app.get("/")
async def root():
    return {"message": "Localization Workflow Management System API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)