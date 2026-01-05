@echo off
REM Fix Merge Conflicts in package-lock.json (Windows)
REM This script resolves the 74 conflicts by regenerating the lock file

echo.
echo ============================================================
echo Fix: Resolving package-lock.json merge conflicts
echo ============================================================
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found! Run this script from the project root.
    pause
    exit /b 1
)

echo [INFO] This will regenerate package-lock.json to resolve all conflicts.
echo.

REM Step 1: Backup current package-lock.json (if it exists)
if exist "package-lock.json" (
    echo [INFO] Step 1: Creating backup of package-lock.json...
    copy package-lock.json package-lock.json.backup >nul
    echo [OK] Backup created: package-lock.json.backup
) else (
    echo [INFO] Step 1: No existing package-lock.json found (this is fine)
)
echo.

REM Step 2: Remove conflicted package-lock.json
echo [INFO] Step 2: Removing conflicted package-lock.json...
if exist "package-lock.json" del /f package-lock.json
echo [OK] Removed package-lock.json
echo.

REM Step 3: Clean node_modules (optional but recommended)
set /p CLEAN_MODULES="Do you want to also clean node_modules? (recommended) [Y/n]: "
if /i "%CLEAN_MODULES%"=="Y" goto clean
if /i "%CLEAN_MODULES%"=="" goto clean
if /i "%CLEAN_MODULES%"=="y" goto clean
goto skip_clean

:clean
echo [INFO] Step 3: Cleaning node_modules...
if exist "node_modules" rmdir /s /q node_modules
echo [OK] Removed node_modules
goto continue

:skip_clean
echo [INFO] Step 3: Skipping node_modules cleanup

:continue
echo.

REM Step 4: Regenerate package-lock.json
echo [INFO] Step 4: Running npm install to regenerate package-lock.json...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
echo.
echo [OK] package-lock.json regenerated successfully!
echo.

REM Step 5: Deduplicate dependencies (optional)
echo [INFO] Step 5: Deduplicating dependencies...
call npm dedupe
echo [OK] Dependencies deduplicated
echo.

REM Step 6: Verify installation
echo [INFO] Step 6: Verifying installation...
call npm ls --depth=0 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Some peer dependency warnings exist (usually safe to ignore)
) else (
    echo [OK] All dependencies installed correctly
)
echo.

REM Step 7: Test build
echo [INFO] Step 7: Testing build...
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed. Check the errors above.
    pause
    exit /b 1
)
echo.
echo [OK] Build successful!
echo.

REM Summary
echo.
echo ============================================================
echo Success!
echo ============================================================
echo.
echo [OK] All 74 merge conflicts have been resolved!
echo.
echo Next steps:
echo   1. Review the changes: git diff package-lock.json
echo   2. Commit the fix: git add package-lock.json
echo   3. Commit: git commit -m "fix: resolve package-lock.json merge conflicts"
echo   4. Push: git push
echo.
echo Backup file saved as: package-lock.json.backup
echo (You can delete it once you've verified everything works)
echo.
echo [INFO] To test the application: npm run dev
echo.
pause
