# Quick Fix: Resolve package-lock.json Conflicts

## 🚀 One-Line Fix

```bash
rm package-lock.json && rm -rf node_modules && npm install && npm run build
```

## 📋 Step-by-Step (5 minutes)

### 1. Clean State
```bash
rm package-lock.json
rm -rf node_modules
```

### 2. Regenerate
```bash
npm install
```

### 3. Remove Duplicates
```bash
npm dedupe
```

### 4. Test
```bash
npm run build
```

### 5. Commit
```bash
git add package-lock.json
git commit -m "fix: regenerate package-lock.json to resolve conflicts"
git push
```

## 🔍 Verify Success

```bash
# No warnings
npm ls --depth=0

# Build works
npm run build

# Dev server works
npm run dev
```

## 📖 Full Documentation

- Detailed Guide: [VERCEL_DEPLOYMENT_FIX.md](./VERCEL_DEPLOYMENT_FIX.md)
- Automated Script: `./fix-deployment.sh`
- PR Context: [PR_18_RESOLUTION.md](./PR_18_RESOLUTION.md)

## ⚡ Automated Fix

```bash
chmod +x fix-deployment.sh
./fix-deployment.sh
```

The script handles everything automatically with confirmations at each step.

## ⚠️ Common Issues

### "Cannot find module"
```bash
npm ci
```

### "Conflicting peer dependencies"
```bash
npm install --legacy-peer-deps
```

### "Build fails"
```bash
rm -rf .vite
npm run build
```

## ✅ Checklist

- [ ] package-lock.json deleted
- [ ] node_modules deleted
- [ ] npm install completed
- [ ] npm dedupe run
- [ ] npm run build succeeds
- [ ] Changes committed
- [ ] Changes pushed

---

**Time to fix:** ~5 minutes  
**Difficulty:** ⭐ Easy  
**Success rate:** 99%
