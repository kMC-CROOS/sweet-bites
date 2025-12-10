# Email Configuration for SweetBite
# Update these settings to enable real email sending

# Gmail Configuration (Recommended)
GMAIL_CONFIG = {
    'EMAIL_BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
    'EMAIL_HOST': 'smtp.gmail.com',
    'EMAIL_PORT': 587,
    'EMAIL_USE_TLS': True,
    'EMAIL_HOST_USER': 'your-email@gmail.com',  # Replace with your Gmail
    'EMAIL_HOST_PASSWORD': 'your-app-password',  # Replace with Gmail app password
    'DEFAULT_FROM_EMAIL': 'your-email@gmail.com',  # Replace with your Gmail
}

# Console Configuration (For Testing)
CONSOLE_CONFIG = {
    'EMAIL_BACKEND': 'django.core.mail.backends.console.EmailBackend',
    'DEFAULT_FROM_EMAIL': 'noreply@sweetbite.com',
}

# File Configuration (For Testing)
FILE_CONFIG = {
    'EMAIL_BACKEND': 'django.core.mail.backends.filebased.EmailBackend',
    'EMAIL_FILE_PATH': 'sent_emails',
    'DEFAULT_FROM_EMAIL': 'noreply@sweetbite.com',
}

# Choose which configuration to use
# Change this to 'GMAIL_CONFIG', 'CONSOLE_CONFIG', or 'FILE_CONFIG'
CURRENT_CONFIG = 'CONSOLE_CONFIG'  # Change this line

# Get the selected configuration
def get_email_config():
    if CURRENT_CONFIG == 'GMAIL_CONFIG':
        return GMAIL_CONFIG
    elif CURRENT_CONFIG == 'CONSOLE_CONFIG':
        return CONSOLE_CONFIG
    elif CURRENT_CONFIG == 'FILE_CONFIG':
        return FILE_CONFIG
    else:
        return CONSOLE_CONFIG

# Instructions:
# 1. Set CURRENT_CONFIG to 'GMAIL_CONFIG' for real email sending
# 2. Update GMAIL_CONFIG with your actual Gmail credentials
# 3. Make sure to use Gmail App Password, not your regular password
# 4. Restart Django server after making changes
