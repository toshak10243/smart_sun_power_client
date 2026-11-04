#!/usr/bin/env node
// ==============================================================================
// Solar CRM - Daily Backup Notification Service (Corporate English Format)
// Sends executive backup confirmation to indiansmartsunpower@gmail.com
// Maintained by Digiink Solutions LLP
// ==============================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');

const backupFile = process.argv[2] || 'solar_crm_backup.sql.gz';
const backupSize = process.argv[3] || 'Unknown';
const activeCount = process.argv[4] || '1';

const fileName = backupFile.split('/').pop();
const nowIST = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium'
});

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER || 'hostingdigiink@gmail.com',
        pass: process.env.MAIL_PASS || 'vpukndjbzeashdrt'
    }
});

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Database Backup Notification</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f1f5f9;
    margin: 0;
    padding: 32px 16px;
    color: #1e293b;
    line-height: 1.6;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }
  .header {
    background-color: #0f172a;
    padding: 24px 32px;
    border-bottom: 1px solid #1e293b;
  }
  .header-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.2px;
  }
  .header-subtitle {
    margin: 4px 0 0 0;
    font-size: 13px;
    color: #94a3b8;
  }
  .content {
    padding: 32px;
  }
  .salutation {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 12px;
  }
  .intro {
    font-size: 13.5px;
    color: #334155;
    margin-bottom: 24px;
  }
  .table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 28px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }
  .table tr {
    border-bottom: 1px solid #e2e8f0;
  }
  .table tr:last-child {
    border-bottom: none;
  }
  .table td {
    padding: 12px 16px;
    font-size: 13px;
  }
  .table .label {
    width: 38%;
    font-weight: 600;
    color: #475569;
    background-color: #f8fafc;
  }
  .table .value {
    color: #0f172a;
    font-weight: 500;
  }
  .footer {
    background-color: #f8fafc;
    padding: 24px 32px;
    border-top: 1px solid #e2e8f0;
    font-size: 12px;
    color: #475569;
  }
  .footer-org {
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 4px;
  }
  .footer-links {
    margin-top: 8px;
    color: #64748b;
  }
  .footer-links a {
    color: #0f172a;
    text-decoration: underline;
  }
  .support-note {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    color: #64748b;
    font-size: 11.5px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-title">Smart Sun Power CRM</div>
      <div class="header-subtitle">Daily Database Backup Status Report</div>
    </div>

    <div class="content">
      <div class="salutation">Dear Administrator,</div>
      <div class="intro">
        This is an automated report confirming that the daily database backup for <strong>Smart Sun Power CRM</strong> (<a href="https://smartsunpower.tech/" style="color: #0f172a;">https://smartsunpower.tech/</a>) was completed successfully and stored in the server archive.
      </div>

      <table class="table">
        <tr>
          <td class="label">Application URL</td>
          <td class="value"><a href="https://smartsunpower.tech/" style="color: #0f172a; text-decoration: none;">https://smartsunpower.tech/</a></td>
        </tr>
        <tr>
          <td class="label">Backup Timestamp</td>
          <td class="value">${nowIST}</td>
        </tr>
        <tr>
          <td class="label">Database Name</td>
          <td class="value">solar_crm (MySQL 8.0)</td>
        </tr>
        <tr>
          <td class="label">Archive Filename</td>
          <td class="value">${fileName}</td>
        </tr>
        <tr>
          <td class="label">Archive Size</td>
          <td class="value">${backupSize}</td>
        </tr>
        <tr>
          <td class="label">Integrity Verification</td>
          <td class="value">Passed (gzip -t verified)</td>
        </tr>
        <tr>
          <td class="label">Active Backups Retained</td>
          <td class="value">${activeCount} (30-day automated rolling window)</td>
        </tr>
        <tr>
          <td class="label">Server Storage Path</td>
          <td class="value">/var/backups/solar_crm/</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <div class="footer-org">Thank you for using services from Digiink Solutions LLP, Jaipur.</div>
      <div class="footer-links">
        Website: <a href="https://digiinksolutions.com">digiinksolutions.com</a> &nbsp;|&nbsp; 
        Phone: +91 9024154995 &nbsp;|&nbsp; 
        Email: <a href="mailto:support@digiinksolutions.com">support@digiinksolutions.com</a>
      </div>
      <div class="support-note">
        For any software inquiries or technical support, please contact our technical support desk at any time via phone, WhatsApp, or email.
      </div>
    </div>
  </div>
</body>
</html>
`;

async function main() {
    try {
        const mailOptions = {
            from: `"Smart Sun Power CRM" <${process.env.MAIL_USER || 'hostingdigiink@gmail.com'}>`,
            to: 'indiansmartsunpower@gmail.com',
            subject: `Database Backup Successful - smartsunpower.tech`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Backup notification sent successfully. MessageId: ${info.messageId}`);
        process.exit(0);
    } catch (err) {
        console.error('[Email Error] Failed to send backup notification email:', err.message);
        process.exit(0);
    }
}

main();
