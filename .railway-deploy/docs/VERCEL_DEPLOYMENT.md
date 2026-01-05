# Deploying to Vercel

This document explains how to deploy the Assistente Jurídico PJe application to Vercel.

> **📌 Important Notes:**
> - If you're experiencing 404 errors on `/_spark/*` endpoints, see [SPARK_FIX_GUIDE.md](./SPARK_FIX_GUIDE.md)
> - If you have package-lock.json conflicts, see [VERCEL_DEPLOYMENT_FIX.md](./VERCEL_DEPLOYMENT_FIX.md)
> - For PR #18 resolution details, see [PR_18_RESOLUTION.md](./PR_18_RESOLUTION.md)

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A [GitHub Personal Access Token](https://github.com/settings/tokens) with the following scopes:
   - `repo`
   - `workflow`
3. Your GitHub runtime name from `runtime.config.json`

## Environment Variables

Before deploying, you need to configure the following environment variables in your Vercel project settings:

### Required Variables

1. **GITHUB_RUNTIME_PERMANENT_NAME**
   - Value: Get this from your `runtime.config.json` file (the `app` field)
   - Example: `97a1cb1e48835e0ecf1e`
   - This is used to connect to GitHub's Spark runtime API

2. **GITHUB_TOKEN**
   - Value: Your GitHub Personal Access Token
   - Create at: https://github.com/settings/tokens
   - Required scopes: `repo`, `workflow`
   - Example: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - This authenticates requests to GitHub's API

### Optional Variables

3. **GITHUB_API_URL**
   - Value: `https://api.github.com` (default)
   - Only change if using GitHub Enterprise Server

4. **VITE_GOOGLE_CLIENT_ID**
   - Your Google OAuth Client ID
   - Required for Google Calendar integration

5. **VITE_GOOGLE_API_KEY**
   - Your Google API Key
   - Required for Google Calendar and Docs APIs

6. **VITE_REDIRECT_URI**
   - Your Vercel deployment URL
   - Example: `https://your-app.vercel.app`

7. **VITE_APP_ENV**
   - Set to `production` for production deployments

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
5. Add the environment variables listed above
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

5. Add environment variables:
   ```bash
   vercel env add GITHUB_RUNTIME_PERMANENT_NAME
   vercel env add GITHUB_TOKEN
   # Add other variables as needed
   ```

## Vercel Configuration

The repository includes a `vercel.json` file that configures:

### API Proxies

The application uses Vercel serverless functions to proxy Spark API requests:

- **`/_spark/llm`** → Proxied to GitHub Models API via `/api/llm-proxy.ts`
- **`/_spark/kv/*`** → Proxied to GitHub Runtime KV API via `/api/spark-proxy.ts`
- **`/_spark/*`** → Proxied to GitHub Runtime API via `/api/spark-proxy.ts`

### Security Headers

The configuration includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## Troubleshooting

### 404 Errors on `/_spark/*` Endpoints

If you see 404 errors for `/_spark/*` endpoints:

1. **Check environment variables**: Ensure `GITHUB_RUNTIME_PERMANENT_NAME` and `GITHUB_TOKEN` are set in Vercel
2. **Verify GitHub token**: Make sure your token has the required scopes
3. **Check runtime name**: Verify the value matches what's in `runtime.config.json`

**📖 For detailed troubleshooting and step-by-step instructions, see [SPARK_FIX_GUIDE.md](./SPARK_FIX_GUIDE.md)**

### Build Failures

If the build fails:

1. **Check build logs** in Vercel dashboard
2. **Verify Node version**: The app requires Node.js 18 or higher
3. **Check dependencies**: Run `npm install` locally to verify there are no dependency issues

### Application Loads but Features Don't Work

If the app loads but Spark features don't work:

1. **Check browser console** for errors
2. **Verify API calls**: Open browser DevTools → Network tab and check `/_spark/*` requests
3. **Check response status**: If getting 401/403, your GitHub token may be invalid or have insufficient permissions

## Architecture Notes

### Spark Framework on Vercel

GitHub Spark is designed to work with GitHub's runtime infrastructure. When deploying to Vercel:

- The Vite dev server's proxy configuration doesn't work in production
- We use Vercel serverless functions (`/api/*.ts`) to proxy requests
- The functions forward requests to GitHub's runtime API with authentication

### Static Site with Serverless Functions

The deployment architecture is:
1. **Static frontend**: Built by Vite, served from `dist/`
2. **Serverless functions**: Handle `/_spark/*` API requests
3. **GitHub APIs**: Backend services for KV storage and LLM

## Security Considerations

1. **Never commit tokens**: Keep `.env` files out of version control
2. **Use environment variables**: All secrets should be in Vercel environment variables
3. **Rotate tokens**: Periodically rotate your GitHub Personal Access Token
4. **Minimal scopes**: Only grant required scopes to your GitHub token

## Performance

Vercel serverless functions have:
- 10-second timeout on Hobby plan
- 60-second timeout on Pro plan

If you experience timeout issues with large API requests, consider upgrading to Pro plan.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Spark Framework](https://github.com/github/spark)
