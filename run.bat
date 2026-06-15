@echo off
echo ===================================================
echo   Starting Lotus Planner Local Development Server  
echo ===================================================
echo.
echo Opening browser at http://localhost:3000...
start http://localhost:3000
echo.
echo Launching Vite development server...
npm run dev
pause
