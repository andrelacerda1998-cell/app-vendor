@echo off
REM Android Build Fix Script (Windows)
REM This script attempts to fix common Android build issues automatically

setlocal enabledelayedexpansion

echo ================================================
echo   Android Build Fix Script (Windows)
echo ================================================
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Check if we're in the right directory
if not exist "%PROJECT_ROOT%\package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root.
    exit /b 1
)

cd /d "%PROJECT_ROOT%"
echo [SUCCESS] Project root: %PROJECT_ROOT%
echo.

REM Step 1: Check prerequisites
echo [STEP 1] Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js: %NODE_VERSION%

where yarn >nul 2>nul
if %errorlevel% equ 0 (
    set PACKAGE_MANAGER=yarn
    for /f "tokens=*" %%i in ('yarn --version') do set PM_VERSION=%%i
    echo [SUCCESS] Package manager: yarn !PM_VERSION!
) else (
    where npm >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Neither yarn nor npm is installed
        exit /b 1
    )
    set PACKAGE_MANAGER=npm
    for /f "tokens=*" %%i in ('npm --version') do set PM_VERSION=%%i
    echo [SUCCESS] Package manager: npm !PM_VERSION!
)

where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Java is not installed
    exit /b 1
)
echo [SUCCESS] Java installed

echo.

REM Step 2: Fix gradle.properties
echo [STEP 2] Updating gradle.properties...

set GRADLE_PROPS=%PROJECT_ROOT%\android\gradle.properties

if exist "%GRADLE_PROPS%" (
    copy "%GRADLE_PROPS%" "%GRADLE_PROPS%.backup" >nul
    echo [SUCCESS] Backed up gradle.properties

    REM Update memory settings (simple approach for Windows batch)
    powershell -Command "(gc '%GRADLE_PROPS%') -replace 'org.gradle.jvmargs=.*', 'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m' | Out-File -encoding ASCII '%GRADLE_PROPS%'"
    echo [SUCCESS] Updated JVM memory settings

    findstr /C:"android.lintOptions.abortOnError" "%GRADLE_PROPS%" >nul
    if %errorlevel% neq 0 (
        echo. >> "%GRADLE_PROPS%"
        echo # Skip linting during release builds >> "%GRADLE_PROPS%"
        echo android.lintOptions.abortOnError=false >> "%GRADLE_PROPS%"
        echo [SUCCESS] Added lint abort option
    )
) else (
    echo [WARNING] gradle.properties not found, will be created during prebuild
)

echo.

REM Step 3: Clean caches
echo [STEP 3] Cleaning caches...
echo [WARNING] This will remove caches and may take a while to rebuild

set /p CONTINUE="Continue? (y/n): "
if /i not "%CONTINUE%"=="y" (
    echo [WARNING] Skipped cache cleaning
    goto step4
)

REM Clean metro cache
if exist "%TEMP%" (
    del /s /q "%TEMP%\metro-*" 2>nul
    del /s /q "%TEMP%\react-*" 2>nul
    del /s /q "%TEMP%\haste-map-*" 2>nul
    echo [SUCCESS] Cleaned Metro bundler cache
)

REM Clean package manager cache
if "%PACKAGE_MANAGER%"=="yarn" (
    call yarn cache clean
    echo [SUCCESS] Cleaned yarn cache
) else (
    call npm cache clean --force
    echo [SUCCESS] Cleaned npm cache
)

REM Clean gradle cache
if exist "%USERPROFILE%\.gradle\caches" (
    rmdir /s /q "%USERPROFILE%\.gradle\caches" 2>nul
    echo [SUCCESS] Cleaned Gradle cache
)

REM Clean expo cache
if exist "%PROJECT_ROOT%\.expo" (
    rmdir /s /q "%PROJECT_ROOT%\.expo" 2>nul
    echo [SUCCESS] Cleaned Expo cache
)

REM Clean android build folders
if exist "%PROJECT_ROOT%\android" (
    cd /d "%PROJECT_ROOT%\android"
    if exist "gradlew.bat" (
        call gradlew.bat clean 2>nul
        echo [SUCCESS] Ran gradle clean
    )
    if exist "app\build" rmdir /s /q "app\build" 2>nul
    if exist "build" rmdir /s /q "build" 2>nul
    echo [SUCCESS] Cleaned Android build folders
    cd /d "%PROJECT_ROOT%"
)

:step4
echo.

REM Step 4: Reinstall dependencies
echo [STEP 4] Checking dependencies...

if not exist "node_modules" (
    echo [WARNING] node_modules not found, installing...
    call %PACKAGE_MANAGER% install
    echo [SUCCESS] Dependencies installed
) else (
    set /p REINSTALL="Reinstall node_modules? (y/n): "
    if /i "!REINSTALL!"=="y" (
        rmdir /s /q "node_modules" 2>nul
        call %PACKAGE_MANAGER% install
        echo [SUCCESS] Dependencies reinstalled
    ) else (
        echo [SUCCESS] Using existing node_modules
    )
)

echo.

REM Step 5: Run prebuild
echo [STEP 5] Running Expo prebuild...

if not exist "android" (
    echo [WARNING] Android folder not found, running prebuild...
    call node_modules\.bin\expo prebuild --platform android
    echo [SUCCESS] Prebuild completed
) else (
    set /p PREBUILD="Re-run prebuild? This will regenerate android folder (y/n): "
    if /i "!PREBUILD!"=="y" (
        if exist "android" rmdir /s /q "android" 2>nul
        if exist "ios" rmdir /s /q "ios" 2>nul
        call node_modules\.bin\expo prebuild --clean --platform android
        echo [SUCCESS] Prebuild completed
    ) else (
        echo [SUCCESS] Using existing android folder
    )
)

echo.

REM Step 6: Build APK
echo [STEP 6] Building APK...

cd /d "%PROJECT_ROOT%\android"

if not exist "gradlew.bat" (
    echo [ERROR] gradlew.bat not found in android folder
    exit /b 1
)

echo [WARNING] Starting build process (this may take several minutes)...
echo.

REM Try building
echo [ATTEMPT] Building APK...
call gradlew.bat assembleRelease --no-daemon

cd /d "%PROJECT_ROOT%"

echo.
echo ================================================

if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo [SUCCESS] BUILD SUCCESSFUL!
    echo.
    echo [SUCCESS] APK Location: android\app\build\outputs\apk\release\app-release.apk

    REM Show APK size
    for %%A in ("android\app\build\outputs\apk\release\app-release.apk") do (
        set APK_SIZE=%%~zA
        echo [SUCCESS] APK Size: !APK_SIZE! bytes
    )

    REM Try to open the folder
    start "" "android\app\build\outputs\apk\release\"
) else (
    echo [ERROR] BUILD FAILED
    echo.
    echo [ERROR] Build failed. Check the output above for details.
    echo.
    echo [WARNING] Common fixes:
    echo   1. Check Java version (should be JDK 17)
    echo   2. Ensure ANDROID_HOME is set correctly
    echo   3. Try increasing memory in android\gradle.properties
    echo   4. Review ANDROID_BUILD_TROUBLESHOOTING.md for more solutions
    exit /b 1
)

echo ================================================

endlocal
