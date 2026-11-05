
# SmartShopPOS Windows Startup Launcher
# Starts the API, frontend and browser in the correct order.

$ErrorActionPreference = "Stop"

# Resolve paths relative to this script so it works if the project moves.
$ProjectRoot = $PSScriptRoot
$ApiDirectory = Join-Path $ProjectRoot "apps\api"
$WebDirectory = Join-Path $ProjectRoot "apps\web"

$ApiEntry = Join-Path $ApiDirectory "dist\server.js"
$ViteCommand = Join-Path $WebDirectory "node_modules\.bin\vite.cmd"

$ApiPort = 4000
$WebPort = 5173

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       SMARTSHOPPOS STARTUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check that required files exist before starting.
if (!(Test-Path $ApiEntry)) {
    throw "API build not found: $ApiEntry. Build the API first."
}

if (!(Test-Path $ViteCommand)) {
    throw "Vite not found. Install frontend dependencies first."
}

# Check whether a TCP port is already accepting connections.
function Test-LocalPort {
    param([int]$Port)

    $client = [System.Net.Sockets.TcpClient]::new()

    try {
        $result = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        $connected = $result.AsyncWaitHandle.WaitOne(1000, $false)

        if (!$connected) {
            return $false
        }

        $client.EndConnect($result)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

# Wait for a service to become available.
function Wait-ForPort {
    param(
        [int]$Port,
        [string]$ServiceName,
        [int]$TimeoutSeconds = 45
    )

    Write-Host "Waiting for $ServiceName on port $Port..." -ForegroundColor Yellow

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        if (Test-LocalPort -Port $Port) {
            Write-Host "$ServiceName is responding." -ForegroundColor Green
            return $true
        }

        Start-Sleep -Seconds 2
    }

    return $false
}

# Start API if it isn't already running.
if (Test-LocalPort -Port $ApiPort) {
    Write-Host "API is already running on port $ApiPort." -ForegroundColor Green
}
else {
    Write-Host "Starting SmartShopPOS API..." -ForegroundColor Yellow

    Start-Process `
        -FilePath $env:ComSpec `
        -ArgumentList @(
            "/k",
            "cd /d `"$ApiDirectory`" && node .\dist\server.js"
        ) `
        -WorkingDirectory $ApiDirectory

    if (!(Wait-ForPort -Port $ApiPort -ServiceName "SmartShopPOS API")) {
        throw "API did not start. Check the API terminal for errors."
    }
}

# Start frontend in Vite development mode if it isn't running.
if (Test-LocalPort -Port $WebPort) {
    Write-Host "Frontend is already running on port $WebPort." -ForegroundColor Green
}
else {
    Write-Host "Starting SmartShopPOS frontend..." -ForegroundColor Yellow

    Start-Process `
        -FilePath $env:ComSpec `
        -ArgumentList @(
            "/k",
            "cd /d `"$WebDirectory`" && pnpm dev --host 127.0.0.1"
        ) `
        -WorkingDirectory $WebDirectory

    if (!(Wait-ForPort -Port $WebPort -ServiceName "SmartShopPOS frontend")) {
        throw "Frontend did not start. Check the frontend terminal for errors."
    }
}

# Open the application after both services are available.
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       SMARTSHOPPOS IS READY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "API:      http://localhost:4000"
Write-Host "Frontend: http://localhost:5173"
Write-Host ""

$AppUrl = "http://127.0.0.1:5173/"

Write-Host "Opening SmartShopPOS at $AppUrl" -ForegroundColor Cyan

Start-Process "http://localhost:5173"
