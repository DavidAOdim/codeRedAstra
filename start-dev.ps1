# Start development servers for ThermaMind

Write-Host "🚀 Starting ThermaMind Development Servers..." -ForegroundColor Cyan

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Starting Backend Server...' -ForegroundColor Green; node src/server.js"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '🎨 Starting Frontend Dev Server...' -ForegroundColor Magenta; npm run dev"

Write-Host "✅ Both servers started in separate windows!" -ForegroundColor Green
Write-Host "📡 Backend: http://localhost:8080" -ForegroundColor Yellow
Write-Host "🎨 Frontend: http://localhost:5173" -ForegroundColor Yellow
