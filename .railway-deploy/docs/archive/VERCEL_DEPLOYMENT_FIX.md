# Fixing Vercel Deployment: Resolving package-lock.json Conflicts

## Issue Summary

Pull Request #18 is experiencing merge conflicts in `package-lock.json` between the `copilot/analisar-logs-e-corrigir-problemas` branch and the `principal` (main) branch. This document provides step-by-step instructions to resolve these conflicts.

## Problem Description

- **Conflict Type**: Merge conflicts in `package-lock.json`
- **Root Cause**: Both branches modified dependencies independently
- **Impact**: Prevents automatic merge and deployment
- **Files Affected**: `package-lock.json` (51 conflicts reported)

## Solution: Regenerate package-lock.json

The safest and most reliable way to resolve `package-lock.json` conflicts is to regenerate the file from scratch.

### Step-by-Step Resolution

#### Option 1: Using Git (Recommended)

```bash
# 1. Checkout the branch with conflicts
git checkout copilot/analisar-logs-e-corrigir-problemas

# 2. Merge the main branch
git merge principal

# 3. When conflicts occur, accept the current package.json
git checkout --ours package.json

# 4. Delete the conflicted package-lock.json
rm package-lock.json

# 5. Delete node_modules to ensure clean state
rm -rf node_modules

# 6. Regenerate package-lock.json
npm install

# 7. Add the regenerated file
git add package-lock.json package.json

# 8. Complete the merge
git commit -m "fix: resolve package-lock.json conflicts by regenerating lockfile"

# 9. Push the changes
git push origin copilot/analisar-logs-e-corrigir-problemas
```

#### Option 2: Using GitHub Web Interface

1. **Navigate to the PR**
   - Go to Pull Request #18
   - Click "Resolve conflicts"

2. **For package-lock.json**
   - Click "Accept both changes" is NOT recommended
   - Instead, note that you'll regenerate this file

3. **Mark conflicts as resolved**
   - Mark the file as resolved in GitHub UI
   - This is temporary - we'll fix it properly

4. **After merging or locally**
   ```bash
   # Pull the merged branch
   git pull origin principal
   
   # Delete and regenerate
   rm package-lock.json
   npm install
   
   # Commit the fix
   git add package-lock.json
   git commit -m "fix: regenerate package-lock.json after merge"
   git push
   ```

## Verifying the Fix

After regenerating `package-lock.json`, verify that:

### 1. No Duplicate Dependencies

```bash
# Check for duplicate packages
npm ls --depth=0

# Look for any warnings about duplicates
npm dedupe
```

### 2. All Dependencies Resolve

```bash
# Clean install to verify
rm -rf node_modules
npm ci
```

### 3. Build Works

```bash
# Test the build
npm run build
```

### 4. TypeScript Types

```bash
# Ensure types are correct
npx tsc --noEmit
```

## Common Issues and Solutions

### Issue 1: "ERESOLVE unable to resolve dependency tree"

**Solution:**
```bash
# Use legacy peer deps
npm install --legacy-peer-deps

# Or use force (less recommended)
npm install --force
```

### Issue 2: Version Mismatches

**Solution:**
Check `package.json` for version conflicts:
- Ensure React and React-DOM have matching versions
- Check that @types/react matches React version
- Verify all @radix-ui packages are compatible

### Issue 3: Workspace Conflicts

**Solution:**
If using npm workspaces:
```bash
# Install from root
npm install

# Install in workspace
cd packages/spark-tools
npm install
```

## Preventing Future Conflicts

### Best Practices

1. **Always commit package.json and package-lock.json together**
   ```bash
   git add package.json package-lock.json
   git commit -m "deps: update dependencies"
   ```

2. **Use consistent npm version**
   - Check version: `npm --version`
   - Recommended: npm 9.x or 10.x

3. **Keep package-lock.json in version control**
   - Never add to `.gitignore`
   - Always include in commits

4. **Regenerate after branch merges**
   ```bash
   # After merging
   rm package-lock.json
   npm install
   ```

5. **Use npm ci in CI/CD**
   - In Vercel, GitHub Actions, etc.
   - Ensures lockfile is respected

## Vercel-Specific Configuration

### Ensure Correct Build Settings

In Vercel dashboard:

1. **Build Command**
   ```bash
   npm install && npm run build
   ```

2. **Install Command** (optional override)
   ```bash
   npm ci
   ```

3. **Node Version**
   - Check `.nvmrc` or set in Vercel
   - Recommended: 18.x or 20.x

### Environment Variables Required

Make sure these are set in Vercel:

```env
GITHUB_RUNTIME_PERMANENT_NAME=<from runtime.config.json>
GITHUB_TOKEN=<your github personal access token>
```

## Deployment Checklist

After resolving conflicts:

- [ ] `package-lock.json` regenerated successfully
- [ ] No merge conflict markers in any files
- [ ] `npm install` completes without errors
- [ ] `npm run build` succeeds locally
- [ ] All tests pass (if applicable)
- [ ] Vercel environment variables are set
- [ ] PR is ready to merge
- [ ] Deployment preview works in Vercel

## Additional Resources

- [npm Documentation - package-lock.json](https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json)
- [Vercel Build Configuration](https://vercel.com/docs/build-step)
- [Git Merge Conflicts](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)

## Need Help?

If you continue experiencing issues:

1. Check the Vercel deployment logs
2. Review the GitHub Actions logs (if applicable)
3. Verify all environment variables are set correctly
4. Try deploying from a clean branch

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-18  
**Status:** Active Resolution Guide
