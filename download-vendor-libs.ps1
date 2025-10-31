# Завантаження TonConnect бібліотек (вендоризація)

# Скрипт для завантаження TonConnect SDK та UI локально
# Після цього можна прибрати CDN з CSP для максимальної безпеки

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TonConnect Vendorization Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Створюємо директорію якщо не існує
$vendorDir = ".\static\js\vendor"
if (-not (Test-Path $vendorDir)) {
    New-Item -ItemType Directory -Path $vendorDir -Force | Out-Null
    Write-Host "Created vendor directory: $vendorDir" -ForegroundColor Green
}

# URLs для завантаження
$sdkUrl = "https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js"
$uiUrl = "https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js"

# Файли для збереження
$sdkFile = Join-Path $vendorDir "tonconnect-sdk.min.js"
$uiFile = Join-Path $vendorDir "tonconnect-ui.min.js"

Write-Host "Downloading TonConnect libraries...`n" -ForegroundColor Yellow

# Завантаження SDK
Write-Host "[1/2] Downloading TonConnect SDK..." -ForegroundColor Green
try {
    Invoke-WebRequest -Uri $sdkUrl -OutFile $sdkFile -UseBasicParsing
    $sdkSize = (Get-Item $sdkFile).Length
    Write-Host "  Downloaded: $sdkFile ($sdkSize bytes)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Failed to download SDK - $_" -ForegroundColor Red
    exit 1
}

# Завантаження UI
Write-Host "[2/2] Downloading TonConnect UI..." -ForegroundColor Green
try {
    Invoke-WebRequest -Uri $uiUrl -OutFile $uiFile -UseBasicParsing
    $uiSize = (Get-Item $uiFile).Length
    Write-Host "  Downloaded: $uiFile ($uiSize bytes)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Failed to download UI - $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Download Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Перевірка розмірів файлів
Write-Host "File verification:" -ForegroundColor Yellow
Get-ChildItem $vendorDir\*.js | ForEach-Object {
    $size = $_.Length
    $sizeKB = [math]::Round($size / 1KB, 2)
    $status = if ($size -gt 50KB) { "OK" } else { "WARNING: File too small" }
    $color = if ($size -gt 50KB) { "Green" } else { "Yellow" }
    Write-Host "  $($_.Name): ${sizeKB} KB - $status" -ForegroundColor $color
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Update templates/base.html to use local files:" -ForegroundColor Gray
Write-Host "     <script src=`"{{ url_for('static', filename='js/vendor/tonconnect-sdk.min.js') }}`" defer></script>" -ForegroundColor Gray
Write-Host "     <script src=`"{{ url_for('static', filename='js/vendor/tonconnect-ui.min.js') }}`" defer></script>" -ForegroundColor Gray
Write-Host "`n  2. Update app.py CSP to remove CDN:" -ForegroundColor Gray
Write-Host "     Remove: https://unpkg.com https://cdn.jsdelivr.net from script-src" -ForegroundColor Gray
Write-Host "     Change: script-src 'self' 'unsafe-inline' → script-src 'self'" -ForegroundColor Gray
Write-Host "`n  3. Test locally:" -ForegroundColor Gray
Write-Host "     flask run" -ForegroundColor Gray
Write-Host "     Open browser console and verify no CDN requests" -ForegroundColor Gray
Write-Host "`n  4. Commit and deploy:" -ForegroundColor Gray
Write-Host "     git add static/js/vendor/" -ForegroundColor Gray
Write-Host "     git commit -m 'feat: Vendorize TonConnect libs for stricter CSP'" -ForegroundColor Gray
Write-Host "     git push" -ForegroundColor Gray

Write-Host "`nDocumentation: static/js/vendor/README.md`n" -ForegroundColor Cyan
