# Installation Guide

This guide will help you set up the Localization Management System on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **MongoDB** (version 4.4 or higher)
- **Git**
- **OpenAI API Key** (optional, for AI features)

## Quick Setup

### 1. Install Dependencies

```bash
# Install all dependencies (root, server, and client)
npm run install:all
```

### 2. Set up Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cd server
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/localization

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# OpenAI API (optional - for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Email Configuration (optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Application
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 4. Start the Application

```bash
# Start both backend and frontend in development mode
npm run dev
```

This will start:
- Backend API server on http://localhost:5000
- Frontend React app on http://localhost:3000

## Manual Setup (Alternative)

If you prefer to start services individually:

### Backend Setup

```bash
cd server
npm install
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm start
```

## Initial Setup

### 1. Create Demo Users

The system includes demo accounts for testing. You can register new users or use these credentials:

- **Admin**: admin@demo.com / password
- **Product Team**: product@demo.com / password  
- **Finance Team**: finance@demo.com / password
- **Translator**: translator@demo.com / password

### 2. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health

## Features Overview

### 🎯 Role-Based Access

- **Product Team**: Manage localization projects, track costs, assign translators
- **Finance Team**: Review invoices, track spending, approve payments
- **Translation Team**: Complete tasks, submit invoices, track earnings
- **Admin Team**: System administration, user management, AI configuration

### 🚀 Key Capabilities

- **Dashboard Analytics**: Role-specific dashboards with interactive charts
- **Cost Management**: Automated cost calculation with approval workflows
- **Translation Memory**: Leverage previous translations for cost savings
- **AI Assistant**: Role-based conversational interface for help and queries
- **Invoice Management**: End-to-end invoice processing and payment tracking
- **Bulk Operations**: Efficient handling of multiple projects and tasks

## API Documentation

The API is RESTful and includes the following main endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product

### Translations
- `GET /api/translations` - List translation tasks
- `POST /api/translations` - Create translation task
- `PUT /api/translations/:id` - Update task status

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice status

### AI Assistant
- `POST /api/ai/chat` - Chat with AI assistant
- `GET /api/ai/conversation-starters` - Get role-based conversation starters

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   - Ensure MongoDB is running
   - Check the MONGODB_URI in your .env file

2. **Port Already in Use**
   ```
   Error: listen EADDRINUSE :::5000
   ```
   - Change the PORT in your .env file
   - Or kill the process using the port: `lsof -ti:5000 | xargs kill -9`

3. **AI Features Not Working**
   - Ensure you have a valid OpenAI API key
   - Check your OpenAI account has sufficient credits
   - Verify the OPENAI_API_KEY in your .env file

### Development Tips

1. **Hot Reloading**: Both frontend and backend support hot reloading during development

2. **Database Reset**: To reset the database, you can drop the MongoDB collection:
   ```bash
   mongo localization --eval "db.dropDatabase()"
   ```

3. **Logs**: Check the console output for detailed error messages and API logs

## Production Deployment

For production deployment, consider:

1. **Environment Variables**: Set NODE_ENV=production
2. **Database**: Use MongoDB Atlas or a dedicated MongoDB instance
3. **Security**: Use strong JWT secrets and enable HTTPS
4. **Process Management**: Use PM2 or similar for process management
5. **Reverse Proxy**: Use Nginx for serving static files and load balancing

## Support

If you encounter any issues:

1. Check the console logs for error messages
2. Ensure all prerequisites are installed and running
3. Verify your environment variables are correctly set
4. Check that all ports are available and not blocked by firewall

## Next Steps

Once the system is running:

1. **Explore Dashboards**: Login with different roles to see role-specific features
2. **Test AI Assistant**: Try the conversational interface with role-based queries
3. **Create Projects**: Set up your first localization project
4. **Invite Team Members**: Add users with appropriate roles
5. **Configure Settings**: Customize auto-approval thresholds and rates

The system is designed to be intuitive and self-explanatory, with comprehensive role-based workflows for managing the entire localization process.