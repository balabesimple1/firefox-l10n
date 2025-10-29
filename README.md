# Localization Management System

A comprehensive localization workflow management system that supports multiple team roles and provides end-to-end translation project management.

## Features

### 🎯 Multi-Role Support
- **Product Team**: Request translations, track costs, monitor progress
- **Finance Team**: Manage invoices, track spending, approve payments
- **Translation Team**: Manage tasks, submit invoices, update translations
- **Admin Team**: System administration, user management, AI integration

### 🚀 Key Capabilities
- **Cost Estimation & Auto-Approval**: Automated cost calculation with configurable approval thresholds
- **Translation Memory**: Leverage previous translations for cost savings
- **AI Integration**: AI-powered translations and conversational assistant
- **Comprehensive Reporting**: Interactive dashboards and detailed analytics
- **Invoice Management**: End-to-end invoice processing and payment tracking
- **Bulk Operations**: Efficient handling of multiple locales and projects

## Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB
- OpenAI API key (for AI features)

### Installation

1. **Clone and install dependencies:**
```bash
npm run install:all
```

2. **Set up environment variables:**
```bash
# Server environment (.env in server/)
MONGODB_URI=mongodb://localhost:27017/localization
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_api_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

3. **Start the development servers:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Architecture

### Backend (Node.js/Express)
- RESTful API with MongoDB
- JWT authentication
- Role-based authorization
- OpenAI integration
- Automated email notifications

### Frontend (React/Material-UI)
- Modern responsive design
- Role-based dashboards
- Interactive charts and reporting
- Real-time updates
- AI chat interface

### Database Schema
- Products, Locales, Translators
- Translation Tasks & Memory
- Invoices & Payment tracking
- User roles & permissions

## Team Workflows

### Product Team Workflow
1. Request new product localization
2. Configure locales and translators
3. Monitor translation progress
4. Review cost estimates and approve
5. Track spending via dashboards

### Finance Team Workflow
1. Review monthly invoices
2. Track spending by product/translator
3. Approve payments
4. Generate financial reports

### Translation Team Workflow
1. View assigned translation tasks
2. Download resources for translation
3. Update translation memory
4. Submit monthly invoices
5. Track payment status

### Admin Team Workflow
1. Manage projects and translators
2. Configure system settings
3. Monitor overall operations
4. Manage AI integrations

## API Documentation

### Authentication
```
POST /api/auth/login
POST /api/auth/register
GET /api/auth/profile
```

### Products
```
GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
```

### Translations
```
GET /api/translations
POST /api/translations
PUT /api/translations/:id
GET /api/translations/stats
```

### Invoices
```
GET /api/invoices
POST /api/invoices
PUT /api/invoices/:id
GET /api/invoices/monthly
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.