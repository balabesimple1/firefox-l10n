# Localization Workflow Management System

A comprehensive system for managing Firefox localization workflows, built with FastAPI backend and React frontend.

## Features

### Product Team
- ✅ Request new products for localization
- ✅ Modify locale inclusion/exclusion on demand
- ✅ Change translator assignments
- ✅ View cost estimates and delivery dates
- ✅ Auto-approve translations below cost threshold
- ✅ Track translation costs via dashboards
- ✅ Monitor localization status (weekly/monthly)
- ✅ Filter locale reports by time period
- ✅ View detailed locale statistics
- ✅ See Translation Memory cost savings
- ✅ View AI translation cost savings
- ✅ Track review status of translations
- ✅ Monthly word count verification
- ✅ Approve/reject monthly translation work

### Finance Team
- ✅ View monthly payout invoices by translator
- ✅ View contributed projects within payouts
- ✅ Filter monthly payout reports
- ✅ View payouts categorized by product
- ✅ Track spending by product (monthly/quarterly/yearly)
- ✅ See estimated upcoming spending per translator
- ✅ Verify invoice payout approvals
- ✅ Access spending vs budget reports
- ✅ Update invoice payout status

### Translation Team
- ✅ View translation requests by product/locale
- ✅ View detailed task statistics
- ✅ Upload cost and effort estimations
- ✅ Bulk download translation resources
- ✅ Update Translation Memory
- ✅ Update glossary with terminology
- ✅ Submit invoices for payout processing
- ✅ Raise monthly invoices by product
- ✅ View invoice and payment status
- ✅ Update translation task status
- ✅ Update status after completion

### Admin Team
- ✅ Add, view, and edit projects
- ✅ Add, view, and edit translators
- ✅ Manage translator rates per locale
- ✅ Manage Translation Memory
- ✅ Manage glossary
- ✅ AI-powered quick translations
- ✅ View ongoing product translations
- ✅ Change translator assignments on demand
- ✅ One-time project approval process
- ✅ View comprehensive cost reports
- ✅ Set default translator recommendations
- ✅ Manage AI integration

### AI Assistant
- ✅ Conversational interface for querying data
- ✅ Role-based question answering
- ✅ Context-aware conversation starters
- ✅ AI-powered translations with TM/Glossary integration
- ✅ Translation Memory management
- ✅ Glossary management

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Primary database
- **OpenAI GPT-4** - AI assistant and translations
- **JWT** - Authentication
- **Alembic** - Database migrations

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **React Query** - Data fetching and caching
- **React Router** - Navigation
- **Axios** - HTTP client

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or use SQLite for development)
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd localization-workflow
   ```

2. **Environment setup**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database**
   ```bash
   docker-compose exec backend python setup.py
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Option 2: Manual Setup

1. **Backend setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your database settings
   python setup.py  # Initialize database and demo data
   uvicorn main:app --reload
   ```

2. **Frontend setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Demo Credentials

The setup script creates demo users for testing:

- **Admin**: admin@example.com / admin123
- **Product Manager**: product@example.com / product123
- **Finance Manager**: finance@example.com / finance123
- **Translator 1**: translator@example.com / translator123
- **Translator 2**: translator2@example.com / translator123

## Project Structure

```
/workspace/
├── backend/                 # FastAPI backend
│   ├── main.py             # Application entry point
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── auth.py             # Authentication logic
│   ├── database.py         # Database configuration
│   └── routers/            # API route handlers
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
├── browser/                # Firefox localization files
├── devtools/               # DevTools localization files
├── toolkit/                # Toolkit localization files
├── docker-compose.yml      # Docker services
└── setup.py               # Database initialization
```

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

### Key API Endpoints

- **Authentication**: `/api/auth/`
- **Projects**: `/api/projects/`
- **Translators**: `/api/translators/`
- **Tasks**: `/api/tasks/`
- **Invoices**: `/api/invoices/`
- **Reports**: `/api/reports/`
- **AI Assistant**: `/api/ai/`

## Database Schema

The system uses the following main entities:

- **Users** - System users with role-based access
- **Translators** - Translator profiles with specializations and rates
- **Projects** - Localization projects with target locales
- **TranslationTasks** - Individual translation assignments
- **Invoices** - Payment requests and tracking
- **TranslationMemory** - Reusable translation segments
- **Glossary** - Standardized terminology
- **AITranslations** - AI-generated translations with confidence scores

## Configuration

### Environment Variables

**Backend (.env)**:
```env
DATABASE_URL=postgresql://user:password@localhost/db_name
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-api-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend**:
```env
REACT_APP_API_URL=http://localhost:8000/api
```

### AI Integration

The system integrates with OpenAI GPT-4 for:
- Conversational AI assistant
- Automatic translations
- Translation quality assessment
- Cost estimation improvements

Set your OpenAI API key in the backend `.env` file to enable AI features.

## Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## Integration with Existing Firefox L10n

This system is designed to work alongside the existing Firefox localization infrastructure:

- **Source Files**: Reads from existing `.ftl` and `.properties` files
- **Pontoon Integration**: Can be extended to sync with Pontoon
- **GitHub Integration**: Tracks changes from mozilla-firefox repositories
- **Automation**: Supports automated workflows via GitHub Actions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

For questions or issues:
1. Check the API documentation at `/docs`
2. Review the demo data created by `setup.py`
3. Check the browser console for frontend errors
4. Review backend logs for API issues

## Roadmap

- [ ] Pontoon API integration
- [ ] Advanced AI translation models
- [ ] Real-time collaboration features
- [ ] Mobile application
- [ ] Advanced analytics and reporting
- [ ] Automated quality assurance
- [ ] Integration with more translation tools