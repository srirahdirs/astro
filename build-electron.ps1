# Fix for ERR_ELECTRON_BUILDER_CANNOT_EXECUTE
# Run from project root: powershell -ExecutionPolicy Bypass -File ./build-electron.ps1

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# 1. Kill any running instances (they lock the dist folder!)
Write-Host "Stopping Wedding Horoscope Matcher if running..." -ForegroundColor Yellow
Get-Process -Name "WeddingHoroscopeMatcher","electron" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Remove dist folder (must be done when app is closed)
$distPath = Join-Path $projectRoot "dist"
Write-Host "Removing old dist folder..." -ForegroundColor Yellow
if (Test-Path $distPath) {
    Get-ChildItem $distPath -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { $_.Attributes = 'Normal' }
    Remove-Item -Path $distPath -Recurse -Force -ErrorAction SilentlyContinue
    if (Test-Path $distPath) { Write-Host "WARNING: Could not remove dist. Close File Explorer and any app using it, then retry." -ForegroundColor Red }
}
Start-Sleep -Seconds 2

# 3. Clear caches (corrupted downloads can cause errors)
Write-Host "Clearing caches..." -ForegroundColor Yellow
Remove-Item -Path "$env:LOCALAPPDATA\electron-builder\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\electron\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Build to dist-build (fresh dir avoids "file in use" lock on dist)
Write-Host "`nBuilding to dist-build (avoids locked dist folder)..." -ForegroundColor Yellow
$env:USE_HARD_LINKS = "false"
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"

# Remove dist-build if it exists (from previous run)
$distBuildPath = Join-Path $projectRoot "dist-build"
if (Test-Path $distBuildPath) {
    Remove-Item -Path $distBuildPath -Recurse -Force -ErrorAction SilentlyContinue
}

# Rebuild better-sqlite3 for system Node (app runs Next.js with system Node)
Write-Host "Rebuilding better-sqlite3 for system Node..." -ForegroundColor Yellow
npm rebuild better-sqlite3 2>$null

npm run clean
npx next build
npx electron-builder --win -c electron-builder-temp.yml

if ($LASTEXITCODE -eq 0) {
    # Move output to dist
    if (Test-Path $distPath) { Remove-Item -Path $distPath -Recurse -Force -ErrorAction SilentlyContinue }
    Rename-Item -Path $distBuildPath -NewName "dist" -Force
    Write-Host "`nBuild complete! Output: $projectRoot\dist" -ForegroundColor Green
} else {
    Write-Host "`nBuild failed." -ForegroundColor Red
}
