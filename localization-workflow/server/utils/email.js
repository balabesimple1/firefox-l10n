const nodemailer = require('nodemailer');
const { logger } = require('./logger');

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const templates = {
  taskAssigned: (data) => ({
    subject: `New Translation Task Assigned: ${data.taskTitle}`,
    html: `
      <h2>New Translation Task Assigned</h2>
      <p>Hello ${data.translatorName},</p>
      <p>You have been assigned a new translation task:</p>
      <ul>
        <li><strong>Task:</strong> ${data.taskTitle}</li>
        <li><strong>Project:</strong> ${data.projectName}</li>
        <li><strong>Locale:</strong> ${data.localeName}</li>
        <li><strong>Word Count:</strong> ${data.wordCount}</li>
        <li><strong>Due Date:</strong> ${data.dueDate}</li>
      </ul>
      <p>Please log in to the system to view the task details.</p>
      <p>Best regards,<br>Localization Team</p>
    `
  }),

  invoiceSubmitted: (data) => ({
    subject: `Invoice Submitted for Review: ${data.invoiceNumber}`,
    html: `
      <h2>Invoice Submitted for Review</h2>
      <p>Hello,</p>
      <p>A new invoice has been submitted for review:</p>
      <ul>
        <li><strong>Invoice Number:</strong> ${data.invoiceNumber}</li>
        <li><strong>Translator:</strong> ${data.translatorName}</li>
        <li><strong>Project:</strong> ${data.projectName}</li>
        <li><strong>Amount:</strong> $${data.amount}</li>
        <li><strong>Period:</strong> ${data.month}/${data.year}</li>
      </ul>
      <p>Please review and approve the invoice in the system.</p>
      <p>Best regards,<br>Localization Team</p>
    `
  }),

  invoiceApproved: (data) => ({
    subject: `Invoice Approved: ${data.invoiceNumber}`,
    html: `
      <h2>Invoice Approved</h2>
      <p>Hello ${data.translatorName},</p>
      <p>Your invoice has been approved:</p>
      <ul>
        <li><strong>Invoice Number:</strong> ${data.invoiceNumber}</li>
        <li><strong>Amount:</strong> $${data.amount}</li>
        <li><strong>Project:</strong> ${data.projectName}</li>
      </ul>
      <p>Payment will be processed according to our payment schedule.</p>
      <p>Best regards,<br>Finance Team</p>
    `
  }),

  monthlyReport: (data) => ({
    subject: `Monthly Localization Report - ${data.month}/${data.year}`,
    html: `
      <h2>Monthly Localization Report</h2>
      <p>Hello,</p>
      <p>Here's your monthly localization summary for ${data.month}/${data.year}:</p>
      <h3>Summary</h3>
      <ul>
        <li><strong>Tasks Completed:</strong> ${data.completedTasks}</li>
        <li><strong>Words Translated:</strong> ${data.wordsTranslated}</li>
        <li><strong>Total Spending:</strong> $${data.totalSpending}</li>
        <li><strong>Active Projects:</strong> ${data.activeProjects}</li>
      </ul>
      <p>Please log in to the system for detailed reports.</p>
      <p>Best regards,<br>Localization Team</p>
    `
  })
};

// Send email function
const sendEmail = async (to, templateName, data) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      logger.warn('Email not configured, skipping email send');
      return;
    }

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html } = template(data);

    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}`, { messageId: result.messageId });
    
    return result;
  } catch (error) {
    logger.error('Failed to send email', { 
      to, 
      templateName, 
      error: error.message 
    });
    throw error;
  }
};

// Bulk email function
const sendBulkEmail = async (recipients, templateName, data) => {
  try {
    const promises = recipients.map(recipient => 
      sendEmail(recipient, templateName, data)
    );
    
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`Bulk email completed`, { 
      templateName, 
      successful, 
      failed, 
      total: recipients.length 
    });
    
    return { successful, failed, total: recipients.length };
  } catch (error) {
    logger.error('Bulk email failed', { templateName, error: error.message });
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  templates
};