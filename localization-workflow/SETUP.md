# Setup Guide - Localization Workflow System

This guide will walk you through setting up the localization workflow system from scratch.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18+** installed ([Download](https://nodejs.org/))
- [ ] **npm** (comes with Node.js)
- [ ] **PostgreSQL 14+** installed and running ([Download](https://www.postgresql.org/download/))
- [ ] **Git** for version control
- [ ] **OpenAI API Key** (optional, for AI features) - [Get one here](https://platform.openai.com/)
- [ ] **SMTP Server Access** (optional, for email notifications)

## 🚀 Step-by-Step Installation

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd localization-workflow

# Verify the structure
ls -la
# You should see: client/, server/, package.json, README.md
```

### Step 2: Install Dependencies

```bash
# Install root dependencies and all sub-project dependencies
npm run install:all

# This is equivalent to:
# npm install
# cd server && npm install
# cd ../client && npm install
```

### Step 3: Database Setup

#### Create PostgreSQL Database
```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE localization_workflow;
CREATE USER l10n_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE localization_workflow TO l10n_user;

# Exit PostgreSQL
\q
```

#### Configure Environment Variables
```bash
# Copy the example environment file
cp server/.env.example server/.env

# Edit the environment file
nano server/.env  # or use your preferred editor
```

**Required Environment Variables:**
```bash
# Database - Update with your credentials
DATABASE_URL="postgresql://l10n_user:secure_password@localhost:5432/localization_workflow"

# JWT Secret - Generate a secure random string
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV="development"

# CORS - Frontend URL
CORS_ORIGIN="http://localhost:3000"
```

**Optional Environment Variables:**
```bash
# OpenAI API Key (for AI Assistant)
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Email Configuration (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload Configuration
MAX_FILE_SIZE="10MB"
UPLOAD_PATH="./uploads"

# Logging
LOG_LEVEL="info"
```

### Step 4: Database Migration and Seeding

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate

# Seed the database with sample data
npm run seed
```

**Expected Output:**
```
✅ Database migration completed
✅ Sample data seeded successfully
✅ Demo accounts created:
   - Admin: admin@localization.com / admin123
   - Product: product@localization.com / product123  
   - Finance: finance@localization.com / finance123
   - Translator: maria@translator.com / translator123
```

### Step 5: Start the Development Servers

```bash
# Return to root directory
cd ..

# Start both backend and frontend servers
npm run dev
```

This command starts:
- **Backend server**: http://localhost:5000
- **Frontend server**: http://localhost:3000

### Step 6: Verify Installation

1. **Open your browser** and navigate to http://localhost:3000
2. **Login** with any of the demo accounts:
   - **Admin**: admin@localization.com / admin123
   - **Product Team**: product@localization.com / product123
   - **Finance Team**: finance@localization.com / finance123
   - **Translator**: maria@translator.com / translator123

3. **Test basic functionality**:
   - Dashboard loads with statistics
   - Navigation works between pages
   - User profile shows correct role
   - AI Assistant responds (if OpenAI key configured)

## 🔧 Configuration Options

### Database Configuration

#### Using Different Database Providers
The system uses Prisma ORM, which supports multiple databases:

```bash
# For MySQL
DATABASE_URL="mysql://username:password@localhost:3306/localization_workflow"

# For SQLite (development only)
DATABASE_URL="file:./dev.db"

# For PostgreSQL (recommended)
DATABASE_URL="postgresql://username:password@localhost:5432/localization_workflow"
```

#### Connection Pool Settings
For production, configure connection pooling:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/localization_workflow?connection_limit=10&pool_timeout=20"
```

### AI Assistant Configuration

#### OpenAI Setup
1. **Get API Key**: Visit https://platform.openai.com/api-keys
2. **Add to Environment**: Set `OPENAI_API_KEY` in `.env`
3. **Test**: Use the AI Assistant at `/ai-assistant`

#### Custom AI Models
To use different models, modify `server/routes/ai.js`:

```javascript
const completion = await openai.chat.completions.create({
  model: "gpt-4", // Change model here
  messages: [...],
  max_tokens: 1000,
  temperature: 0.7
});
```

### Email Configuration

#### Gmail Setup
1. **Enable 2FA** on your Gmail account
2. **Generate App Password**: Google Account → Security → App passwords
3. **Configure Environment**:
   ```bash
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-16-character-app-password"
   ```

#### Other Email Providers
```bash
# Outlook
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587

# Yahoo
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT=587

# Custom SMTP
SMTP_HOST="mail.yourdomain.com"
SMTP_PORT=587
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
Error: Can't reach database server at `localhost:5432`
```

**Solutions:**
1. **Check PostgreSQL is running**: `sudo service postgresql status`
2. **Verify credentials**: Test connection with `psql`
3. **Check firewall**: Ensure port 5432 is open
4. **Verify DATABASE_URL**: Check connection string format

#### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**
1. **Kill existing process**: `lsof -ti:5000 | xargs kill -9`
2. **Change port**: Set `PORT=5001` in `.env`
3. **Check for other services**: `netstat -tulpn | grep :5000`

#### Prisma Migration Errors
```bash
Error: Migration failed to apply cleanly to the shadow database
```

**Solutions:**
1. **Reset database**: `npx prisma migrate reset`
2. **Generate client**: `npx prisma generate`
3. **Run migrations**: `npx prisma migrate dev`

#### Frontend Build Errors
```bash
Error: Module not found: Can't resolve '@mui/material'
```

**Solutions:**
1. **Clear node_modules**: `rm -rf node_modules package-lock.json`
2. **Reinstall**: `npm install`
3. **Check Node version**: Ensure Node.js 18+

### Performance Issues

#### Slow Database Queries
1. **Add indexes**: Check `schema.prisma` for missing indexes
2. **Optimize queries**: Use `include` instead of multiple queries
3. **Connection pooling**: Configure database connection limits

#### Frontend Performance
1. **Enable production build**: `npm run build`
2. **Optimize images**: Compress images and use WebP format
3. **Code splitting**: Implement lazy loading for routes

## 🔒 Security Hardening

### Production Security Checklist

- [ ] **Change default passwords**: Update all demo account passwords
- [ ] **Secure JWT secret**: Use a strong, random JWT secret
- [ ] **Enable HTTPS**: Configure SSL certificates
- [ ] **Database security**: Use strong database passwords
- [ ] **Environment variables**: Never commit `.env` files
- [ ] **CORS configuration**: Restrict CORS origins
- [ ] **Rate limiting**: Implement API rate limiting
- [ ] **Input validation**: Ensure all inputs are validated
- [ ] **Audit logging**: Enable comprehensive logging

### Security Configuration

#### JWT Security
```bash
# Generate secure JWT secret (32+ characters)
JWT_SECRET="$(openssl rand -base64 32)"
```

#### CORS Configuration
```bash
# Production CORS (restrict to your domain)
CORS_ORIGIN="https://yourdomain.com"

# Multiple origins
CORS_ORIGIN="https://yourdomain.com,https://app.yourdomain.com"
```

#### Rate Limiting
Add to `server/index.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📊 Monitoring Setup

### Logging Configuration

#### Winston Logging Levels
```bash
# Set log level in .env
LOG_LEVEL="info"  # error, warn, info, debug
```

#### Log Files Location
- **Error logs**: `server/logs/error.log`
- **Combined logs**: `server/logs/combined.log`
- **Console output**: Development mode only

### Health Monitoring

#### Health Check Endpoint
```bash
# Check system health
curl http://localhost:5000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "healthy",
    "ai": "configured"
  }
}
```

#### Database Monitoring
```bash
# Check database connection
cd server
npx prisma db pull

# View database schema
npx prisma studio
```

## 🚀 Production Deployment

### Build for Production

```bash
# Build frontend
cd client
npm run build

# Build output will be in client/dist/
```

### Environment Variables for Production

```bash
NODE_ENV="production"
DATABASE_URL="postgresql://user:pass@prod-db:5432/localization_workflow"
JWT_SECRET="your-production-jwt-secret"
CORS_ORIGIN="https://your-production-domain.com"
```

### Process Management

#### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start application
cd server
pm2 start index.js --name "localization-workflow"

# Monitor
pm2 status
pm2 logs localization-workflow
```

#### Using Docker
```bash
# Build Docker image
docker build -t localization-workflow .

# Run container
docker run -d -p 5000:5000 --env-file .env localization-workflow
```

## 📞 Getting Help

### Support Resources

1. **Documentation**: Check README.md for detailed information
2. **Issues**: Create GitHub issues for bugs or feature requests
3. **Logs**: Check application logs for error details
4. **Community**: Join Mozilla L10n community discussions

### Debug Mode

Enable debug logging:
```bash
# Set debug level
LOG_LEVEL="debug"

# Restart servers
npm run dev
```

### Common Commands

```bash
# Reset everything and start fresh
npm run install:all
cd server && npm run migrate:reset && npm run seed
cd .. && npm run dev

# Check system status
curl http://localhost:5000/health
curl http://localhost:5000/api/auth/me

# View database
cd server && npx prisma studio

# Check logs
tail -f server/logs/combined.log
```

---

**🎉 Congratulations!** Your localization workflow system should now be running successfully. Visit http://localhost:3000 to start using the system.