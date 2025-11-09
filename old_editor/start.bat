@echo off
echo ========================================
echo RisuAI Character Editor Starting...
echo ========================================
echo.
echo This will open the Character Editor in your default browser.
echo.
echo You can test:
echo - CBS Scripts
echo - Lua Scripts  
echo - Regex Triggers
echo.
echo Press Ctrl+C to stop the server when done.
echo ========================================
echo.

cd /d "%~dp0"

REM Try to start with Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Python server on http://localhost:8000
    echo.
    start http://localhost:8000
    python -m http.server 8000
    goto :end
)

REM Try Python3 if python doesn't work
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Python3 server on http://localhost:8000
    echo.
    start http://localhost:8000
    python3 -m http.server 8000
    goto :end
)

REM If no Python, just open the file directly
echo Python not found. Opening file directly...
echo Note: Some features may not work without a local server.
echo.
start index.html

:end
