# API Documentation - Localization Workflow System

This document provides comprehensive API documentation for the Localization Workflow Management System.

## 🔐 Authentication

All API endpoints (except login/register) require authentication via JWT token.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "ADMIN",
    "isActive": true,
    "translatorProfile": null
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "TRANSLATOR"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": { /* user object */ },
  "token": "jwt_token_here"
}
```

#### GET /api/auth/me
Get current user information.

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "ADMIN",
  "isActive": true,
  "translatorProfile": {
    "id": "translator_id",
    "specializations": ["Spanish", "French"],
    "experience": 5,
    "rating": 4.8,
    "totalEarnings": 15000.00
  }
}
```

## 📁 Project Management

### GET /api/projects
List all projects with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by project status (ACTIVE, INACTIVE, ARCHIVED)
- `search` (optional): Search in project name and description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "projects": [
    {
      "id": "project_id",
      "name": "Firefox Browser",
      "description": "Main Firefox browser localization",
      "status": "ACTIVE",
      "autoApprove": false,
      "costThreshold": 1000.00,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "createdBy": {
        "id": "user_id",
        "name": "Product Manager",
        "email": "pm@mozilla.com"
      },
      "locales": [
        {
          "id": "project_locale_id",
          "locale": {
            "id": "locale_id",
            "code": "es-ES",
            "name": "Spanish (Spain)"
          },
          "translator": {
            "id": "translator_id",
            "user": {
              "id": "user_id",
              "name": "Maria Garcia",
              "email": "maria@translator.com"
            }
          },
          "totalStrings": 1000,
          "translatedStrings": 850,
          "reviewedStrings": 800,
          "warningCount": 5,
          "errorCount": 2
        }
      ],
      "_count": {
        "translationTasks": 25
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### POST /api/projects
Create a new project. **Requires ADMIN or PRODUCT_TEAM role.**

**Request:**
```json
{
  "name": "New Product",
  "description": "Description of the new product",
  "repository": "https://github.com/mozilla/new-product",
  "autoApprove": true,
  "costThreshold": 500.00,
  "locales": ["locale_id_1", "locale_id_2"]
}
```

**Response:**
```json
{
  "message": "Project created successfully",
  "project": { /* project object */ }
}
```

### GET /api/projects/:id
Get detailed project information.

**Response:**
```json
{
  "id": "project_id",
  "name": "Firefox Browser",
  "description": "Main Firefox browser localization",
  "status": "ACTIVE",
  "autoApprove": false,
  "costThreshold": 1000.00,
  "repository": "https://github.com/mozilla/firefox-l10n-source",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "createdBy": { /* user object */ },
  "locales": [ /* array of project locales */ ],
  "translationTasks": [ /* array of tasks */ ],
  "costEstimations": [ /* array of cost estimates */ ]
}
```

### PUT /api/projects/:id
Update project information. **Requires ADMIN or PRODUCT_TEAM role.**

**Request:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "INACTIVE",
  "autoApprove": true,
  "costThreshold": 750.00
}
```

### POST /api/projects/:id/locales
Add or remove locales from a project. **Requires ADMIN or PRODUCT_TEAM role.**

**Request:**
```json
{
  "localeIds": ["locale_id_1", "locale_id_2"],
  "action": "add"  // or "remove"
}
```

### POST /api/projects/:id/locales/:localeId/assign
Assign a translator to a project locale. **Requires ADMIN or PRODUCT_TEAM role.**

**Request:**
```json
{
  "translatorId": "translator_id"
}
```

## 📋 Translation Tasks

### GET /api/translations/tasks
List translation tasks with filtering.

**Query Parameters:**
- `status` (optional): Filter by task status
- `projectId` (optional): Filter by project
- `localeId` (optional): Filter by locale
- `assigneeId` (optional): Filter by assignee
- `page`, `limit`: Pagination

**Response:**
```json
{
  "tasks": [
    {
      "id": "task_id",
      "title": "Translate privacy features",
      "description": "Translate strings for new privacy dashboard",
      "wordCount": 250,
      "status": "IN_PROGRESS",
      "priority": 4,
      "dueDate": "2024-02-01T00:00:00.000Z",
      "completedAt": null,
      "estimatedCost": 37.50,
      "actualCost": null,
      "aiTranslated": false,
      "aiCostSavings": 0,
      "tmCostSavings": 5.25,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "project": {
        "id": "project_id",
        "name": "Firefox Browser"
      },
      "locale": {
        "id": "locale_id",
        "code": "es-ES",
        "name": "Spanish (Spain)"
      },
      "assignee": {
        "id": "user_id",
        "name": "Maria Garcia",
        "email": "maria@translator.com"
      }
    }
  ],
  "pagination": { /* pagination object */ }
}
```

### POST /api/translations/tasks
Create a new translation task. **Requires ADMIN or PRODUCT_TEAM role.**

**Request:**
```json
{
  "projectId": "project_id",
  "localeId": "locale_id",
  "title": "Task title",
  "description": "Task description",
  "wordCount": 100,
  "priority": 3,
  "dueDate": "2024-02-01T00:00:00.000Z",
  "assigneeId": "user_id"
}
```

### PUT /api/translations/tasks/:id
Update a translation task.

**Request:**
```json
{
  "status": "COMPLETED",
  "wordCount": 120,
  "actualCost": 18.00,
  "aiTranslated": true,
  "aiCostSavings": 6.00,
  "tmCostSavings": 3.00
}
```

## 🧠 Translation Memory & Glossary

### GET /api/translations/memory
Get translation memory entries.

**Query Parameters:**
- `sourceLocale`, `targetLocale`: Filter by locales
- `search`: Search in source/target text
- `page`, `limit`: Pagination

**Response:**
```json
{
  "memories": [
    {
      "id": "memory_id",
      "sourceText": "Save bookmark",
      "targetText": "Guardar marcador",
      "sourceLocale": "en-US",
      "targetLocale": "es-ES",
      "quality": 1.0,
      "usage": 15,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

### POST /api/translations/memory
Add or update translation memory entry. **Requires ADMIN or TRANSLATOR role.**

**Request:**
```json
{
  "sourceText": "Delete bookmark",
  "targetText": "Eliminar marcador",
  "sourceLocale": "en-US",
  "targetLocale": "es-ES",
  "quality": 0.95
}
```

### GET /api/translations/glossary
Get glossary terms.

**Query Parameters:**
- `locale`: Filter by locale
- `category`: Filter by category
- `search`: Search in term/definition

**Response:**
```json
{
  "terms": [
    {
      "id": "term_id",
      "term": "bookmark",
      "definition": "A saved shortcut to a web page",
      "context": "Used in browser navigation",
      "locale": "en-US",
      "category": "Navigation",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

### POST /api/translations/glossary
Add or update glossary term. **Requires ADMIN or TRANSLATOR role.**

**Request:**
```json
{
  "term": "cookie",
  "definition": "Small data file stored by websites",
  "context": "Privacy and data storage",
  "locale": "en-US",
  "category": "Privacy"
}
```

## 💰 Invoice Management

### GET /api/invoices
List invoices with filtering.

**Query Parameters:**
- `status`: Filter by invoice status (DRAFT, SUBMITTED, APPROVED, PAID, REJECTED)
- `month`, `year`: Filter by period
- `projectId`, `translatorId`: Filter by project/translator
- `page`, `limit`: Pagination

**Response:**
```json
{
  "invoices": [
    {
      "id": "invoice_id",
      "invoiceNumber": "INV-2024-01-1704067200000",
      "month": 1,
      "year": 2024,
      "totalAmount": 450.00,
      "currency": "USD",
      "status": "SUBMITTED",
      "submittedAt": "2024-01-15T00:00:00.000Z",
      "approvedAt": null,
      "paidAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z",
      "project": {
        "id": "project_id",
        "name": "Firefox Browser"
      },
      "translator": {
        "id": "translator_id",
        "user": {
          "id": "user_id",
          "name": "Maria Garcia",
          "email": "maria@translator.com"
        }
      },
      "lineItems": [
        {
          "id": "line_item_id",
          "description": "Translation work - Privacy features",
          "wordCount": 3000,
          "ratePerWord": 0.15,
          "amount": 450.00
        }
      ]
    }
  ],
  "pagination": { /* pagination object */ }
}
```

### POST /api/invoices
Create a new invoice. **Requires TRANSLATOR role.**

**Request:**
```json
{
  "projectId": "project_id",
  "month": 1,
  "year": 2024,
  "lineItems": [
    {
      "description": "Translation work - January 2024",
      "wordCount": 2500,
      "ratePerWord": 0.18
    },
    {
      "description": "Review work - January 2024",
      "wordCount": 500,
      "ratePerWord": 0.12
    }
  ]
}
```

### PUT /api/invoices/:id/status
Update invoice status.

**Request:**
```json
{
  "status": "APPROVED"
}
```

**Status Transitions:**
- `DRAFT` → `SUBMITTED` (Translator)
- `SUBMITTED` → `APPROVED`/`REJECTED` (Product/Finance/Admin)
- `APPROVED` → `PAID` (Finance only)

## 📊 Reports & Analytics

### GET /api/reports/dashboard
Get dashboard statistics.

**Query Parameters:**
- `period`: Time period (week, month, quarter, year)

**Response:**
```json
{
  "period": "month",
  "stats": {
    "activeProjects": 12,
    "totalTasks": 156,
    "tasksByStatus": {
      "PENDING": 23,
      "IN_PROGRESS": 45,
      "COMPLETED": 78,
      "REVIEW_REQUIRED": 8,
      "APPROVED": 2
    },
    "totalTranslators": 15,
    "recentInvoices": 8,
    "totalSpending": 12500.00,
    // Role-specific stats
    "myTasks": 12,           // For translators
    "completedTasks": 8,     // For translators
    "totalEarnings": 2400.00 // For translators
  }
}
```

### GET /api/reports/locale-status
Get locale status report.

**Query Parameters:**
- `projectId` (optional): Filter by project
- `period`: Time period (this_month, last_month, overall)

**Response:**
```json
{
  "period": "this_month",
  "localeStats": [
    {
      "id": "project_locale_id",
      "projectId": "project_id",
      "localeId": "locale_id",
      "locale": {
        "id": "locale_id",
        "code": "es-ES",
        "name": "Spanish (Spain)"
      },
      "project": {
        "id": "project_id",
        "name": "Firefox Browser"
      },
      "translator": {
        "id": "translator_id",
        "user": {
          "id": "user_id",
          "name": "Maria Garcia",
          "email": "maria@translator.com"
        }
      },
      "totalStrings": 1000,
      "translatedStrings": 850,
      "reviewedStrings": 800,
      "warningCount": 5,
      "errorCount": 2,
      "taskStats": {
        "total": 15,
        "completed": 12,
        "inProgress": 2,
        "pending": 1,
        "totalWords": 3500
      }
    }
  ]
}
```

### GET /api/reports/cost-savings
Get cost savings report. **Requires ADMIN, PRODUCT_TEAM, or FINANCE_TEAM role.**

**Query Parameters:**
- `startDate`, `endDate`: Date range
- `projectId` (optional): Filter by project

**Response:**
```json
{
  "summary": {
    "totalAiSavings": 1250.00,
    "totalTmSavings": 850.00,
    "totalSavings": 2100.00,
    "aiTranslatedTasks": 45,
    "tmUtilizedTasks": 78,
    "totalTasks": 156
  },
  "byProject": {
    "Firefox Browser": {
      "aiSavings": 800.00,
      "tmSavings": 600.00,
      "totalSavings": 1400.00,
      "tasks": 89
    },
    "Firefox DevTools": {
      "aiSavings": 450.00,
      "tmSavings": 250.00,
      "totalSavings": 700.00,
      "tasks": 67
    }
  }
}
```

### GET /api/reports/word-count-verification
Get word count verification report. **Requires ADMIN, PRODUCT_TEAM, or FINANCE_TEAM role.**

**Query Parameters:**
- `month`, `year`: Target period

**Response:**
```json
{
  "month": 1,
  "year": 2024,
  "summary": {
    "totalTaskWords": 15000,
    "totalInvoiceWords": 14800,
    "difference": 200,
    "matchPercentage": 99
  },
  "byProject": {
    "Firefox Browser": {
      "taskWords": 10000,
      "invoiceWords": 9900,
      "tasks": [/* task objects */],
      "invoices": [/* invoice objects */]
    }
  },
  "discrepancies": [
    {
      "project": "Firefox DevTools",
      "taskWords": 5000,
      "invoiceWords": 4900,
      "difference": 100
    }
  ]
}
```

## 🤖 AI Assistant

### POST /api/ai/chat
Chat with the AI assistant.

**Request:**
```json
{
  "message": "What's the status of Spanish translations?",
  "context": {
    "userRole": "PRODUCT_TEAM",
    "userId": "user_id"
  }
}
```

**Response:**
```json
{
  "response": "Based on the current data, Spanish (es-ES) translations are progressing well. Here's a summary:\n\n- Firefox Browser: 85% complete (850/1000 strings)\n- Firefox DevTools: 92% complete (460/500 strings)\n- 2 tasks currently in progress\n- 1 task pending assignment\n\nThe Spanish translator Maria Garcia has been very productive this month with 12 completed tasks.",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 95,
    "total_tokens": 245
  }
}
```

### GET /api/ai/conversation-starters
Get role-based conversation starters.

**Response:**
```json
{
  "starters": [
    "What's the current status of our localization projects?",
    "How much will it cost to translate our new feature?",
    "Which translators are available for German localization?",
    "Show me the translation progress for this month",
    "What's our average translation turnaround time?"
  ]
}
```

### POST /api/ai/translate
Quick AI translation.

**Request:**
```json
{
  "text": "Save bookmark",
  "sourceLocale": "en-US",
  "targetLocale": "es-ES",
  "context": "Browser navigation menu"
}
```

**Response:**
```json
{
  "translation": "Guardar marcador",
  "source": "ai_translation",
  "quality": 0.8,
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 8,
    "total_tokens": 33
  }
}
```

## 👥 User Management

### GET /api/users
List users. **Requires ADMIN role.**

**Query Parameters:**
- `role`: Filter by user role
- `search`: Search in name/email
- `page`, `limit`: Pagination

### GET /api/users/translators
List translators.

**Query Parameters:**
- `localeId`: Filter translators with rates for specific locale
- `available`: Filter available translators

**Response:**
```json
[
  {
    "id": "translator_id",
    "userId": "user_id",
    "specializations": ["Spanish", "Portuguese"],
    "experience": 5,
    "rating": 4.8,
    "totalEarnings": 15000.00,
    "user": {
      "id": "user_id",
      "name": "Maria Garcia",
      "email": "maria@translator.com",
      "isActive": true
    },
    "localeRates": [
      {
        "id": "rate_id",
        "localeId": "locale_id",
        "ratePerWord": 0.15,
        "currency": "USD",
        "locale": {
          "id": "locale_id",
          "code": "es-ES",
          "name": "Spanish (Spain)"
        }
      }
    ],
    "_count": {
      "assignments": 8,
      "tasks": 45
    }
  }
]
```

### POST /api/users/translator-rates
Create or update translator rates. **Requires TRANSLATOR or ADMIN role.**

**Request:**
```json
{
  "localeId": "locale_id",
  "ratePerWord": 0.18,
  "currency": "USD"
}
```

### GET /api/users/translator-rates/:translatorId?
Get translator rates.

## 🌐 Locales

### GET /api/translations/locales
Get all available locales.

**Response:**
```json
[
  {
    "id": "locale_id",
    "code": "es-ES",
    "name": "Spanish (Spain)"
  },
  {
    "id": "locale_id_2",
    "code": "fr-FR",
    "name": "French (France)"
  }
]
```

## ⚙️ Admin Endpoints

### GET /api/admin/stats
Get system statistics. **Requires ADMIN role.**

**Response:**
```json
{
  "overview": {
    "totalUsers": 25,
    "totalProjects": 12,
    "totalTasks": 156,
    "totalInvoices": 45,
    "totalTranslators": 15,
    "activeProjects": 10,
    "pendingTasks": 23,
    "pendingInvoices": 8,
    "totalSpending": 45000.00
  },
  "recentActivity": [
    {
      "id": "task_id",
      "title": "Translate privacy features",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "project": { "name": "Firefox Browser" },
      "locale": { "name": "Spanish (Spain)" },
      "assignee": { "name": "Maria Garcia" }
    }
  ]
}
```

### GET /api/admin/settings
Get system settings. **Requires ADMIN role.**

### PUT /api/admin/settings
Update system settings. **Requires ADMIN role.**

**Request:**
```json
{
  "default_currency": "USD",
  "auto_approve_threshold": "500",
  "ai_translation_enabled": "true"
}
```

## 🚨 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message"
}
```

### Validation Errors
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    },
    {
      "field": "password",
      "message": "\"password\" length must be at least 8 characters long"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized / Invalid Token
- `403` - Forbidden / Insufficient Permissions
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## 🔄 Rate Limiting

API requests are rate-limited to prevent abuse:
- **Default**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **AI endpoints**: 20 requests per hour per user

## 📝 Response Headers

### Standard Headers
```http
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Pagination Headers
```http
X-Total-Count: 150
X-Page: 1
X-Per-Page: 10
X-Total-Pages: 15
```

---

**📚 For more information, see the [README.md](README.md) and [SETUP.md](SETUP.md) files.**