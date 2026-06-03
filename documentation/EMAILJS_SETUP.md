# EmailJS Setup Guide

This guide explains how to configure EmailJS for sending verification codes in the MonitoraCult application.

## Overview

EmailJS is used to send verification codes to users during the registration process. The integration includes:
- Sending 6-digit verification codes via email
- Storing codes in Firestore for validation
- 10-minute code expiration

## API Keys

The following EmailJS credentials are configured:

- **Public Key**: `re6QctN7UZLA_gLCL`
- **Private Key**: `_0FbbCUryVjd_jD6exDoA`

## Configuration Steps

### 1. Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Navigate to the dashboard

### 2. Add Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the authentication steps for your provider
5. Copy the **Service ID** (e.g., `service_abc123`)

### 3. Create Email Template

1. In EmailJS dashboard, go to **Email Templates**
2. Click **Create New Template**
3. Configure the template with the following settings:

**Subject**: `Seu código de verificação - MonitoraCult`

**Content** (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Verificação</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333; margin: 0;">MonitoraCult</h1>
        </div>
        <div style="padding: 30px 20px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Código de Verificação</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Olá {{to_name}},
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Seu código de verificação é:
            </p>
            <div style="background-color: #f0f0f0; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px;">
                    {{verification_code}}
                </span>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Este código expirará em 10 minutos.
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Se você não solicitou este código, ignore este email.
            </p>
        </div>
        <div style="background-color: #333; color: #fff; padding: 20px; text-align: center; margin-top: 30px;">
            <p style="margin: 0; font-size: 14px;">© 2024 MonitoraCult. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
```

**Template Variables**:
- `{{to_email}}` - Recipient's email address
- `{{to_name}}` - Recipient's name (extracted from email)
- `{{verification_code}}` - The 6-digit verification code

4. Save the template
5. Copy the **Template ID** (e.g., `template_xyz789`)

### 4. Configure Environment Variables

Add the following to your `.env` file:

```bash
# EmailJS Configuration
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=re6QctN7UZLA_gLCL
EXPO_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
```

Replace `your_service_id_here` and `your_template_id_here` with the actual IDs from EmailJS.

### 5. Test the Integration

The integration is already implemented in the codebase:

- **Service**: `services/emailjsService.js`
- **Context**: `context/CadastroContext.js`

The `sendVerificationCode` function in `CadastroContext` will:
1. Generate a 6-digit code
2. Save it to Firestore with a 10-minute expiration
3. Send the code via EmailJS
4. Return success/failure status

## Usage Example

```javascript
import { useCadastro } from '../context/CadastroContext';

const { sendVerificationCode, verifyCode } = useCadastro();

// Send verification code
const result = await sendVerificationCode('user@example.com');
if (result.success) {
  console.log('Code sent successfully');
}

// Verify code
const verification = await verifyCode('user@example.com', '123456');
if (verification.success) {
  console.log('Code verified successfully');
}
```

## Troubleshooting

### Email Not Sending

1. Check if the Service ID and Template ID are correct in `.env`
2. Verify your email service is properly configured in EmailJS
3. Check the EmailJS dashboard for error logs
4. Ensure the Public Key is correct

### Code Not Working

1. Check Firestore rules for `emailCodes` collection
2. Verify the code hasn't expired (10-minute window)
3. Check console logs for error messages

### Template Variables Not Replacing

1. Ensure template variables match exactly: `{{to_email}}`, `{{to_name}}`, `{{verification_code}}`
2. Check the EmailJS template configuration

## Security Notes

- The Private Key should never be exposed in client-side code
- Only the Public Key is used in the React Native app
- Codes are stored temporarily in Firestore and deleted after verification or expiration
- Codes expire after 10 minutes for security

## Additional Resources

- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [EmailJS React Native SDK](https://www.emailjs.com/docs/sdk/react-native/)
- [EmailJS Templates](https://www.emailjs.com/docs/creating-templates/)
