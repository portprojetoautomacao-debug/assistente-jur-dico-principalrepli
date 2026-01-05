# Fixing Spark Proxy Errors - Deployment Guide

## Problems Fixed

### 1. 404 Errors (Previous Fix)
The TypeScript serverless functions were not handling requests properly, causing 404 errors for all Spark-related endpoints.

### 2. 401 Unauthorized Errors (Latest Fix)
The proxy was using incorrect authentication format, causing GitHub Runtime API to reject requests with 401 Unauthorized errors.

## What Was Wrong

### Original Issue (404s)
The TypeScript serverless functions in the `api/` directory were not handling requests properly, causing 404 errors for all Spark-related endpoints:
- `/_spark/kv/*` - Key-value storage operations
- `/_spark/loaded` - Spark runtime initialization signal
- `/_spark/llm` - LLM (Large Language Model) API proxy

### Authentication Issue (401s)
The proxy was using `Authorization: Bearer ${token}` (capitalized), but GitHub Runtime API expects `Authorization: bearer ${token}` (lowercase).

## Solutions Applied

### Authentication Fix (Latest)
- Changed `Bearer` to `bearer` (lowercase) in Authorization header
- Added explicit check for `GITHUB_TOKEN` environment variable
- Improved error messages when token is missing
- Made token required for all Spark proxy requests

### Proxy Implementation (Previous)
Converted the TypeScript serverless functions to JavaScript with the following improvements:

### 1. `api/spark-proxy.js` and `api/spark-proxy.ts`
Handles all `/_spark/*` requests except `/llm`:
- ✅ Proper CORS preflight (OPTIONS) handling
- ✅ Support for GET, POST, PUT, DELETE methods
- ✅ Proper path parameter handling (including arrays for multiple segments)
- ✅ Better error logging with request context
- ✅ Correct content-type forwarding
- ✅ **NEW**: Correct authentication header format (`bearer` instead of `Bearer`)
- ✅ **NEW**: Explicit GITHUB_TOKEN requirement with helpful error messages

### 2. `api/llm-proxy.js`
Handles `/_spark/llm` requests:
- ✅ CORS preflight support
- ✅ POST-only validation
- ✅ Proper GitHub Models API proxying
- ✅ Better error handling and logging

## Deployment Checklist

### ⚠️ CRITICAL: Verify Environment Variables in Vercel

Before the fix will work, you MUST ensure these environment variables are set in your Vercel project:

1. **Navigate to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Click "Settings" → "Environment Variables"

2. **Required Variables**

   | Variable Name | Description | How to Get It | Example |
   |--------------|-------------|---------------|---------|
   | `GITHUB_RUNTIME_PERMANENT_NAME` | Your GitHub Spark runtime name | From `runtime.config.json` (the `app` field) | `97a1cb1e48835e0ecf1e` |
   | `GITHUB_TOKEN` | GitHub Personal Access Token | Create at https://github.com/settings/tokens | `ghp_xxxxx...` |

3. **Token Requirements**
   Your `GITHUB_TOKEN` must have these scopes:
   - ✅ `repo` - Full control of private repositories
   - ✅ `workflow` - Update GitHub Action workflows

4. **Set Variables for All Environments**
   Make sure to set these for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### How to Set Environment Variables in Vercel

#### Via Dashboard:
```
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Settings"
4. Click "Environment Variables"
5. Add each variable:
   - Key: GITHUB_RUNTIME_PERMANENT_NAME
   - Value: <your runtime name from runtime.config.json>
   - Environment: Production, Preview, Development
   - Click "Save"
   
   - Key: GITHUB_TOKEN
   - Value: <your GitHub token>
   - Environment: Production, Preview, Development
   - Click "Save"
```

#### Via CLI:
```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login
vercel login

# Add environment variables
vercel env add GITHUB_RUNTIME_PERMANENT_NAME production
# When prompted, enter: 97a1cb1e48835e0ecf1e (or your actual runtime name)

vercel env add GITHUB_TOKEN production
# When prompted, enter your GitHub Personal Access Token

# Repeat for preview and development environments
vercel env add GITHUB_RUNTIME_PERMANENT_NAME preview
vercel env add GITHUB_TOKEN preview

vercel env add GITHUB_RUNTIME_PERMANENT_NAME development
vercel env add GITHUB_TOKEN development
```

## After Setting Environment Variables

### Redeploy Your Application
Environment variables are only applied to NEW deployments. After setting them:

1. **Trigger a new deployment**:
   ```bash
   # If using Git integration, push a new commit:
   git commit --allow-empty -m "Trigger redeploy with env vars"
   git push
   
   # OR use Vercel CLI:
   vercel --prod
   ```

2. **Wait for deployment to complete**

3. **Verify the fix works**:
   - Open your deployed app
   - Open browser DevTools (F12)
   - Go to the Network tab
   - Interact with the app
   - Check that `/_spark/kv/*` requests return 200 instead of 404

### Monitoring Logs

To check if the API functions are working:

1. **Vercel Dashboard**:
   - Go to your project
   - Click "Deployments"
   - Click on the latest deployment
   - Click "Functions" tab
   - You should see `spark-proxy` and `llm-proxy` listed
   - Click on them to see logs

2. **Expected Logs**:
   ```
   Proxying GET /_spark/kv/processes to https://api.github.com/runtime/97a1cb1e48835e0ecf1e/kv/processes
   ```

3. **Common Errors**:
   - `GITHUB_RUNTIME_PERMANENT_NAME environment variable is not set`
     → You need to set this env var in Vercel
   
   - `GITHUB_TOKEN environment variable is not set`
     → **FIXED**: The proxy now requires GITHUB_TOKEN and will show this error if missing
     → Set the token in Vercel environment variables
   
   - `Failed to proxy request to GitHub API: 401`
     → **FIXED**: Changed Authorization header from `Bearer` to `bearer` (lowercase)
     → If still getting 401, your GitHub token may be invalid or missing required scopes
     → Regenerate token with `repo` and `workflow` scopes
   
   - `Failed to proxy request to GitHub API: 404`
     → The runtime name might be incorrect
     → Verify `GITHUB_RUNTIME_PERMANENT_NAME` matches the value in `runtime.config.json`

## How the Fix Works

### Request Flow
```
User Browser
    ↓
    GET /_spark/kv/processes
    ↓
Vercel (vercel.json rewrites)
    ↓
    Rewrite to: /api/spark-proxy?service=kv&path=processes
    ↓
api/spark-proxy.js (Serverless Function)
    ↓
    Construct URL: https://api.github.com/runtime/{RUNTIME_NAME}/kv/processes
    ↓
    Forward request with Authorization header
    ↓
GitHub Runtime API
    ↓
    Return KV data
    ↓
api/spark-proxy.js
    ↓
    Forward response back to browser
    ↓
User Browser (receives data)
```

### URL Mapping Examples

| Request URL | Rewrite Rule Matches | API Function | GitHub API URL |
|-------------|---------------------|--------------|----------------|
| `/_spark/kv/processes` | `/_spark/:service/:path*` | `spark-proxy.js` | `/runtime/{NAME}/kv/processes` |
| `/_spark/kv/current-user` | `/_spark/:service/:path*` | `spark-proxy.js` | `/runtime/{NAME}/kv/current-user` |
| `/_spark/loaded` | `/_spark/:service` | `spark-proxy.js` | `/runtime/{NAME}/loaded` |
| `/_spark/llm` | `/_spark/llm` | `llm-proxy.js` | GitHub Models API |

## Testing the Fix

### Test Locally (Optional)
While you can't fully test the Spark integration locally without the GitHub runtime, you can verify the functions are valid:

```bash
# Install Vercel CLI
npm install -g vercel

# Run local dev server
vercel dev

# This will start a local server that mimics Vercel's environment
# Note: Spark features won't work fully, but you can test the API routes exist
```

### Test in Production

1. **Deploy to Vercel**
2. **Open your app**
3. **Open Browser DevTools** (F12)
4. **Go to Network tab**
5. **Interact with features that use Spark**:
   - Open the Process CRM (uses `/_spark/kv/processes`)
   - Use the Harvey chatbot (uses `/_spark/llm` and `/_spark/kv/harvey-messages`)
   - Check user authentication (uses `/_spark/kv/current-user`)

6. **Verify in Network tab**:
   - `/_spark/kv/*` requests should return `200 OK`
   - Response should contain actual data, not 404 HTML
   - Check Response tab shows JSON data

## Troubleshooting

### Still Getting 404s?

1. **Check Function Deployment**:
   - Go to Vercel Dashboard → Your Project → Latest Deployment → Functions
   - Verify `spark-proxy` and `llm-proxy` are listed
   - If not, there may be a build error

2. **Check Environment Variables**:
   - Vercel Dashboard → Settings → Environment Variables
   - Ensure both `GITHUB_RUNTIME_PERMANENT_NAME` and `GITHUB_TOKEN` are set
   - Try redeploying after setting them

3. **Check Vercel Logs**:
   - Vercel Dashboard → Your Project → Deployments → Click deployment → View Function Logs
   - Look for error messages from the API functions

### Getting 500 Errors?

1. **Missing Environment Variables**:
   - Check Vercel function logs
   - Look for "environment variable is not set" errors

2. **Invalid GitHub Token**:
   - Verify token has `repo` and `workflow` scopes
   - Token might be expired - generate a new one

3. **Wrong Runtime Name**:
   - Check `runtime.config.json` for correct value
   - Update `GITHUB_RUNTIME_PERMANENT_NAME` in Vercel

### Getting 401/403 Errors?

- Your GitHub token is invalid, expired, or lacks required scopes
- Generate a new token at https://github.com/settings/tokens
- Ensure it has `repo` and `workflow` scopes
- Update `GITHUB_TOKEN` in Vercel environment variables
- Redeploy

## Security Notes

- ✅ Never commit `.env` files or expose tokens in code
- ✅ All secrets are stored in Vercel environment variables
- ✅ CORS headers are properly configured
- ✅ Security headers are set in `vercel.json`
- ✅ No vulnerabilities found by CodeQL scan

## Next Steps

After deploying this fix:

1. ✅ Verify 404 errors are resolved
2. ✅ Test Spark features work correctly
3. ✅ Monitor Vercel function logs for any issues
4. ✅ Consider setting up alerts for failed API calls

## Related Documentation

- See `VERCEL_DEPLOYMENT.md` for general Vercel deployment guide
- See `OAUTH_SETUP.md` for Google OAuth configuration
- See `README.md` for project overview
