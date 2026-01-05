# Quick Start Guide - OAuth Configuration

## ⚡ Quick Setup (5 minutes)

### Step 1: Copy Environment File
```bash
cp .env.example .env
```

### Step 2: Add Your Client ID to `.env`

Based on your Google Cloud Console configuration:

```env
VITE_GOOGLE_CLIENT_ID=572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com
VITE_REDIRECT_URI=http://localhost:5173
VITE_APP_ENV=development
```

**For production (Vercel):**
```env
VITE_GOOGLE_CLIENT_ID=572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com
VITE_REDIRECT_URI=https://seu-app.vercel.app
VITE_APP_ENV=production
```

### Step 3: Verify Google Cloud Console Settings

Your current configuration from Google Cloud:

✅ **Client ID**: `572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com`  
✅ **Production URL**: `https://seu-app.vercel.app` (configure após deploy)  
✅ **Created**: November 14, 2025  
✅ **Status**: Active

**Authorized JavaScript Origins:**
- `https://seu-app.vercel.app`

**Authorized Redirect URIs:**
- `https://seu-app.vercel.app`

### Step 4: Add Local Development URIs

To test locally, add these to your Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth client: "Cliente Web app automação"
3. Add to **Authorized JavaScript origins**:
   - `http://localhost:5173`
   
4. Add to **Authorized redirect URIs**:
   - `http://localhost:5173`
   
5. Click **Save**

⏰ **Note**: Changes may take 5 minutes to several hours to take effect.

### Step 5: Start Development

```bash
npm install
npm run dev
```

## 🎯 Using Google Auth in Your App

### Import and Use

```typescript
import { GoogleAuthButton, GoogleAuthExample } from '@/components/GoogleAuth'

// In your component
function MyLoginPage() {
  const handleSuccess = (user) => {
    console.log('Logged in:', user)
    // user.id, user.email, user.name, user.picture
  }
  
  return (
    <GoogleAuthButton 
      onSuccess={handleSuccess}
      onError={(err) => console.error(err)}
    />
  )
}
```

### Access Config Anywhere

```typescript
import { config } from '@/lib/config'

console.log(config.google.clientId)
console.log(config.google.redirectUri)
console.log(config.app.environment)
console.log(config.app.isDevelopment)
```

## 🔒 Security Checklist

Before committing code, verify:

- [ ] `.env` is NOT committed (check `.gitignore`)
- [ ] `.env.example` has NO real credentials (only placeholders)
- [ ] Client secrets are NEVER in code
- [ ] Production uses different OAuth client than development
- [ ] All credentials are in environment variables

## 🚀 Deployment Checklist

### Vercel

1. **Environment Variables** (in Vercel dashboard):
   ```
   VITE_GOOGLE_CLIENT_ID=572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com
   VITE_REDIRECT_URI=https://seu-app.vercel.app
   VITE_APP_ENV=production
   GITHUB_RUNTIME_PERMANENT_NAME=97a1cb1e48835e0ecf1e
   GITHUB_TOKEN=seu_token_do_github_aqui
   ```

2. **Google Cloud Console**:
   - Ensure production URL is in authorized origins
   - Ensure production URL is in authorized redirects

3. **Deploy**:
   - Connect repository to Vercel
   - Configure environment variables
   - Deploy automatically on each push to main

## 🐛 Troubleshooting

### "redirect_uri_mismatch"
- Check exact URL match (including trailing slashes)
- Wait up to 5 hours after Google Cloud changes
- Clear browser cache

### "Configuration validation failed"
- Check `.env` file exists
- Check environment variables are set correctly
- Restart dev server after `.env` changes

### "Client ID not found"
- Verify VITE_ prefix on all env vars
- Check for typos in variable names
- Ensure no extra spaces around values

## 📚 More Information

- Full setup guide: `OAUTH_SETUP.md`
- Security policies: `SECURITY.md`
- Project documentation: `PRD.md`

## ✅ Verification

Test your setup:

```bash
# 1. Check .env exists
ls -la .env

# 2. Start dev server
npm run dev

# 3. Open browser
# Should see Google sign-in button (no errors)

# 4. Click sign-in
# Should open Google OAuth popup

# 5. Sign in
# Should redirect back with user data
```

If all steps work ✅ you're ready to develop!
