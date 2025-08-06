# Test Webhook Script
# Use this script to test the Discord webhook integration

param (
    [string]$message = "Hello from AthenaCore!",
    [string]$webhookUrl = $env:ATHENA_DISCORD_WEBHOOK_URL
)

if (-not $webhookUrl) {
    Write-Host "❌ ATHENA_DISCORD_WEBHOOK_URL not found in environment variables" -ForegroundColor Red
    exit 1
}

$body = @{
    content = $message
    username = "AthenaCore Tester"
    avatar_url = "https://i.imgur.com/4M34hi2.png"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Message sent successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to send message:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
