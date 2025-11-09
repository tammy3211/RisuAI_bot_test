@echo off
echo Installing editor dependencies...
call pnpm install

echo.
echo Starting editor development server...
call pnpm dev
