# Google OAuth Setup Guide

This application uses Google OAuth 2.0 for authentication. Follow these steps to configure it properly.

> **🚀 Para deploy no Vercel:** Veja o guia específico [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md) com instruções passo a passo e URLs pré-configuradas.

## ⚠️ Security Warning

**NEVER commit your OAuth client secret to version control!** Client secrets should be treated like passwords.

## Setup Steps

### 1. Create OAuth Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click **Create Credentials** > **OAuth client ID**
4. Select **Web application** as the application type
5. Configure your OAuth client:

   **Name:** Choose a descriptive name (e.g., "Legal Assistant Web App")

   **Authorized JavaScript origins:**
   - For development: `http://localhost:5173`
   - For production: `https://your-domain.com`

   **Authorized redirect URIs:**
   - For development: `http://localhost:5173`
   - For production: `https://your-domain.com`

6. Click **Create**
7. **Copy your Client ID** (you'll need this for the `.env` file)
8. **IMPORTANT:** The client secret is shown only once. Store it securely (password manager recommended)

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   VITE_GOOGLE_CLIENT_ID=572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com
   VITE_REDIRECT_URI=https://assistente-juridico-rs1e.onrender.com
   VITE_APP_ENV=production
   ```

3. **NEVER commit the `.env` file** - it's already in `.gitignore`

### 3. Update Authorized Domains

When you add new URIs to your OAuth client, Google will automatically add those domains to your OAuth consent screen as authorized domains. Changes may take 5 minutes to several hours to take effect.

### 4. Production Deployment

For production deployments (like Render, Vercel, etc.), add environment variables in your platform's dashboard:

**Render:**
1. Go to your service dashboard
2. Navigate to **Environment** tab
3. Add environment variables:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_REDIRECT_URI`
   - `VITE_APP_ENV`

**Vercel:**
1. Go to **Settings** > **Environment Variables**
2. Add the same variables

### 5. OAuth Consent Screen Configuration

If you haven't configured the OAuth consent screen yet:

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (or Internal if using Google Workspace)
3. Fill in required information:
   - App name
   - User support email
   - Developer contact information
4. Add scopes (minimal required):
   - `email`
   - `profile`
   - `openid`
5. Add test users if in testing mode

### 6. Testing Locally

After configuration, start the development server:

```bash
npm run dev
```

The app should be available at `http://localhost:5173`

## Your Current Configuration

Based on the information provided:

- **Client ID:** `572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com`
- **Production URL (Render):** `https://assistente-juridico-rs1e.onrender.com`
- **Production URL (Vercel):** `https://assistente-juridico-ultimo.vercel.app`
- **Preview URL (Vercel):** `https://assistente-juridico-ultimo-git-main-thiagos-projects-9834ca6f.vercel.app`
- **Client Created:** November 14, 2025

> **Nota:** Para o deploy no Vercel, use as URLs do Vercel em "Authorized JavaScript origins" e "Authorized redirect URIs" no Google Cloud Console. Veja [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md) para instruções detalhadas.

## Troubleshooting

### "redirect_uri_mismatch" error
- Ensure the redirect URI in your code exactly matches what's configured in Google Cloud Console
- Check for trailing slashes - `https://example.com` vs `https://example.com/`
- Wait up to 5 hours after making changes in Google Cloud Console

### "access_denied" error
- Check if the user email is added to test users (if app is in testing mode)
- Verify OAuth consent screen is properly configured

### Changes not taking effect
- Google states it can take "5 minutes to a few hours" for configuration changes to propagate
- Clear browser cache and cookies
- Try in an incognito window

## Security Best Practices

1. ✅ **DO** use environment variables for all credentials
2. ✅ **DO** keep `.env` in `.gitignore`
3. ✅ **DO** use different OAuth clients for development and production
4. ✅ **DO** rotate client secrets periodically
5. ✅ **DO** restrict authorized domains to only what's needed
6. ❌ **DON'T** commit secrets to version control
7. ❌ **DON'T** share client secrets in chat/email
8. ❌ **DON'T** use production credentials for local development
9. ❌ **DON'T** expose client secrets in client-side code

## Inactive OAuth Clients

Google will delete OAuth clients that haven't been used for 6 months. You'll receive a notification before deletion and can restore clients up to 30 days after deletion.

## Managing Multiple Client Secrets

You can have multiple active client secrets for the same OAuth client. This is useful when rotating secrets:

1. Add a new secret in Google Cloud Console
2. Update your deployment with the new secret
3. Verify everything works
4. Delete the old secret

This allows zero-downtime secret rotation.

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)
