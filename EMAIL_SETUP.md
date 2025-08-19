# Email Notifications Setup Guide

## Gmail SMTP Configuration (Free)

To enable email notifications, you need to configure Gmail SMTP settings:

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-Factor Authentication on your Gmail account

### 2. Generate App Password
- Go to Google Account > Security > 2-Step Verification
- Scroll down to "App passwords"
- Generate a new app password for "Mail"
- Copy the 16-character password

### 3. Set Environment Variables
Create a `.env` file in the `backend` directory:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
JWT_SECRET=your-jwt-secret
```

### 4. Alternative: Use Environment Variables
You can also set these as system environment variables:

**Windows (PowerShell):**
```powershell
$env:GMAIL_USER="your-email@gmail.com"
$env:GMAIL_APP_PASSWORD="your-16-character-app-password"
```

**Windows (Command Prompt):**
```cmd
set GMAIL_USER=your-email@gmail.com
set GMAIL_APP_PASSWORD=your-16-character-app-password
```

### 5. Test Email Configuration
Once configured, the system will:
- Send welcome emails to new users
- Send price drop alerts when prices fall below target
- Include beautiful HTML email templates

### Features
- ✅ **Free Gmail SMTP** - No cost for sending emails
- ✅ **HTML Email Templates** - Beautiful, responsive emails
- ✅ **Price Drop Alerts** - Automatic notifications when prices drop
- ✅ **Welcome Emails** - Onboarding emails for new users
- ✅ **Error Handling** - Graceful fallback if email fails

### Troubleshooting
- **"Invalid credentials"**: Make sure you're using an App Password, not your regular password
- **"Less secure app access"**: Use App Passwords instead of enabling less secure apps
- **"Authentication failed"**: Double-check your Gmail username and App Password

### Security Notes
- App Passwords are more secure than regular passwords
- Each app password is unique and can be revoked
- No need to enable "less secure app access" 