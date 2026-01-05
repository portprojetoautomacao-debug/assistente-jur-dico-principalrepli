# Security Policy

## Credential Management

### OAuth Credentials

This application uses Google OAuth 2.0 for authentication. **CRITICAL:** Never commit OAuth credentials to version control.

**Required Security Practices:**

1. ✅ **Store credentials in `.env` file** (already in `.gitignore`)
2. ✅ **Use environment variables** via `src/lib/config.ts`
3. ✅ **Use different credentials** for development and production
4. ✅ **Rotate secrets periodically** (every 90 days recommended)
5. ❌ **NEVER hardcode credentials** in source files
6. ❌ **NEVER commit `.env` file** to Git
7. ❌ **NEVER share credentials** in chat, email, or documentation

See `OAUTH_SETUP.md` for detailed configuration instructions.

### Environment Variables

All sensitive configuration should use environment variables prefixed with `VITE_`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here
VITE_REDIRECT_URI=https://your-domain.com
```

Access via the config module:
```typescript
import { config } from '@/lib/config'
const clientId = config.google.clientId
```

## Data Protection

### Client-Side Data

This application uses Spark's `useKV` hook for client-side persistence. Data is stored locally in the browser and should not contain:

- OAuth client secrets (use environment variables)
- API keys or tokens
- Passwords or sensitive credentials
- Unencrypted personally identifiable information (PII)

### User Data

When handling user data from OAuth:
- Only request minimum required scopes (`email`, `profile`, `openid`)
- Do not store sensitive user data unnecessarily
- Comply with GDPR, LGPD, and applicable data protection regulations 

## Reporting Security Issues

If you believe you have found a security vulnerability in any GitHub-owned repository, please report it to us through coordinated disclosure.

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please send an email to opensource-security[@]github.com.

Please include as much of the information listed below as you can to help us better understand and resolve the issue:

  * The type of issue (e.g., buffer overflow, SQL injection, or cross-site scripting)
  * Full paths of source file(s) related to the manifestation of the issue
  * The location of the affected source code (tag/branch/commit or direct URL)
  * Any special configuration required to reproduce the issue
  * Step-by-step instructions to reproduce the issue
  * Proof-of-concept or exploit code (if possible)
  * Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Policy

See [GitHub's Safe Harbor Policy](https://docs.github.com/en/site-policy/security-policies/github-bug-bounty-program-legal-safe-harbor#1-safe-harbor-terms)
