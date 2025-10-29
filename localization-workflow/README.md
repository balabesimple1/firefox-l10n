# Localization Workflow Management System

A comprehensive localization workflow management system designed specifically for Firefox and other Mozilla products. This system provides role-based access control, AI-powered translation assistance, comprehensive reporting, and streamlined invoice management.

## 🚀 Features

### For Product Teams
- ✅ Request new products for localization
- ✅ Modify locale inclusion/exclusion on demand
- ✅ Change translator assignments dynamically
- ✅ View cost estimates and delivery dates
- ✅ Auto-approve translations below cost thresholds
- ✅ Track translation costs with dashboards
- ✅ Monitor localization status (weekly/monthly)
- ✅ Filter reports by time periods
- ✅ View detailed locale statistics
- ✅ Track Translation Memory cost savings
- ✅ Monitor AI translation cost savings
- ✅ Approve/reject monthly translation work

### For Finance Teams
- ✅ View monthly payout invoices by translator
- ✅ See project contributions in payouts
- ✅ Filter payout reports by month
- ✅ View payouts categorized by product
- ✅ Track spending (monthly/quarterly/yearly)
- ✅ See estimated upcoming spending
- ✅ Verify invoice approvals
- ✅ Access budget vs spending reports
- ✅ Update invoice payout status

### For Translation Teams
- ✅ View translation requests by product/locale
- ✅ See detailed task statistics
- ✅ Upload cost/effort estimations
- ✅ Bulk download translation resources
- ✅ Update Translation Memory
- ✅ Manage glossary terms
- ✅ Submit monthly invoices
- ✅ Track invoice and payment status
- ✅ Update translation task status

### For Admin Teams
- ✅ Complete project and translator management
- ✅ Manage translator rates per locale
- ✅ Translation Memory management
- ✅ Glossary management
- ✅ AI-powered quick translations
- ✅ View ongoing translations
- ✅ Dynamic translator assignments
- ✅ Project approval workflows
- ✅ Comprehensive cost reports
- ✅ Set default translator recommendations
- ✅ AI integration management

### AI Assistant
- ✅ Conversational interface for all data queries
- ✅ Role-based conversation starters
- ✅ Context-aware responses
- ✅ Quick translation capabilities
- ✅ Translation Memory integration

## 🏗️ Architecture

### Backend (Node.js + Express + Prisma)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with role-based access control
- **API**: RESTful API with comprehensive error handling
- **AI Integration**: OpenAI GPT for translations and assistance
- **Email**: Nodemailer for notifications
- **File Handling**: Multer for uploads
- **Logging**: Winston for structured logging

### Frontend (React + Material-UI)
- **Framework**: React 18 with Vite
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **Charts**: Recharts + MUI X Charts
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- OpenAI API key (optional, for AI features)
- SMTP server (optional, for email notifications)

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd localization-workflow

# Install all dependencies
npm run install:all
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb localization_workflow

# Copy environment file
cp server/.env.example server/.env

# Edit server/.env with your database URL and other settings
# DATABASE_URL="postgresql://username:password@localhost:5432/localization_workflow"
```

### 3. Database Migration and Seeding

```bash
cd server

# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate

# Seed with sample data
npm run seed
```

### 4. Start Development Servers

```bash
# From the root directory, start both servers
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend server on `http://localhost:3000`

### 5. Login with Demo Accounts

The system comes with pre-configured demo accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | admin@localization.com | admin123 | Full system access |
| **Product Team** | product@localization.com | product123 | Project management |
| **Finance Team** | finance@localization.com | finance123 | Invoice & payment management |
| **Translator** | maria@translator.com | translator123 | Translation tasks & invoicing |

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/localization_workflow"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# OpenAI (for AI Assistant)
OPENAI_API_KEY="your-openai-api-key"

# Email (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload
MAX_FILE_SIZE="10MB"
UPLOAD_PATH="./uploads"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

### Optional Features

#### AI Assistant Setup
1. Get an OpenAI API key from https://platform.openai.com/
2. Add `OPENAI_API_KEY` to your `.env` file
3. The AI assistant will be available at `/ai-assistant`

#### Email Notifications Setup
1. Configure SMTP settings in `.env`
2. Email notifications will be sent for:
   - Task assignments
   - Invoice submissions
   - Invoice approvals
   - Monthly reports

## 📊 Database Schema

The system uses a comprehensive database schema with the following main entities:

- **Users & Translators**: User management with role-based access
- **Projects & Locales**: Project and locale management
- **Translation Tasks**: Task assignment and tracking
- **Invoices**: Invoice creation and approval workflow
- **Translation Memory**: Reusable translations
- **Glossary**: Terminology management
- **Reports**: Analytics and reporting data

See `server/prisma/schema.prisma` for the complete schema definition.

## 🔌 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Project Management
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/locales` - Add/remove locales
- `POST /api/projects/:id/locales/:localeId/assign` - Assign translator

### Translation Tasks
- `GET /api/translations/tasks` - List tasks
- `POST /api/translations/tasks` - Create task
- `GET /api/translations/tasks/:id` - Get task details
- `PUT /api/translations/tasks/:id` - Update task

### Invoice Management
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id/status` - Update invoice status

### Reports & Analytics
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/locale-status` - Locale status report
- `GET /api/reports/cost-savings` - Cost savings report
- `GET /api/reports/translation-progress` - Progress report
- `GET /api/reports/word-count-verification` - Word count verification

### AI Assistant
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/translate` - Quick AI translation
- `GET /api/ai/conversation-starters` - Get conversation starters

## 🎨 User Interface

### Role-Based Dashboards

Each user role sees a customized dashboard with relevant metrics:

#### Admin Dashboard
- System-wide statistics
- User management shortcuts
- Project oversight
- Financial summaries

#### Product Team Dashboard
- Project progress tracking
- Cost estimates and budgets
- Task completion rates
- Translator performance

#### Finance Team Dashboard
- Invoice approval queue
- Payment tracking
- Spending analysis
- Budget vs actual reports

#### Translator Dashboard
- Assigned tasks
- Earnings tracking
- Invoice management
- Performance metrics

### Key Features

#### Modern Material Design
- Clean, professional interface
- Responsive design for all devices
- Dark/light theme support
- Accessibility compliant

#### Advanced Data Tables
- Sorting and filtering
- Pagination
- Export capabilities
- Bulk operations

#### Interactive Charts
- Cost trend analysis
- Progress visualization
- Performance metrics
- Comparative reports

#### Real-time Updates
- Live status updates
- Notification system
- Progress tracking
- Activity feeds

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions per user role
- **Input Validation**: Comprehensive request validation with Joi
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: Helmet.js security headers
- **CORS Configuration**: Configurable cross-origin requests
- **Rate Limiting**: API rate limiting (can be configured)
- **Audit Logging**: Comprehensive activity logging

## 📈 Monitoring & Analytics

### Built-in Reports
- **Dashboard Analytics**: Real-time system metrics
- **Locale Status Reports**: Translation progress by locale
- **Cost Savings Analysis**: AI and TM savings tracking
- **Word Count Verification**: Invoice validation reports
- **Monthly Payout Reports**: Financial summaries
- **Spending Analysis**: Budget tracking and forecasting

### Logging
- **Winston Logging**: Structured logging with multiple levels
- **Error Tracking**: Comprehensive error logging
- **Activity Logs**: User action tracking
- **Performance Metrics**: API response time monitoring

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secrets
4. Configure SMTP for emails
5. Set up SSL certificates

### Build Process
```bash
# Build frontend
cd client
npm run build

# The built files will be in client/dist/
```

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Database Backup
```bash
# Backup database
pg_dump localization_workflow > backup.sql

# Restore database
psql localization_workflow < backup.sql
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow ESLint configuration
- Write meaningful commit messages
- Update documentation for new features
- Test all user roles and permissions
- Ensure responsive design

## 📝 License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the Mozilla L10n team
- Check the documentation wiki

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Complete role-based workflow system
- AI assistant integration
- Comprehensive reporting
- Invoice management
- Translation Memory integration

## 🎯 Roadmap

### Upcoming Features
- Mobile app for translators
- Advanced AI translation models
- Integration with external CAT tools
- Automated quality assurance
- Advanced analytics and ML insights
- Multi-tenant support
- API webhooks
- Advanced workflow automation

---

**Built with ❤️ by the Mozilla L10n Team**