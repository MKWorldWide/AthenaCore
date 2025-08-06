# AthenaCore Setup Script
# Run this script to install dependencies and set up the project

Write-Host "🚀 Setting up AthenaCore..." -ForegroundColor Cyan

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm version
$npmVersion = npm -v
Write-Host "✅ Found npm v$npmVersion" -ForegroundColor Green

# Install project dependencies
Write-Host "📦 Installing project dependencies..." -ForegroundColor Cyan
npm install

# Install TypeScript globally if not already installed
if (-not (Get-Command tsc -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing TypeScript globally..." -ForegroundColor Cyan
    npm install -g typescript
}

# Install ts-node if not already installed
if (-not (Get-Command ts-node -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing ts-node..." -ForegroundColor Cyan
    npm install -g ts-node
}

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "⚙️  Creating .env file..." -ForegroundColor Cyan
    @"
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_token_here
DISCORD_APPLICATION_ID=your_application_id_here
DISCORD_PUBLIC_KEY=your_public_key_here
DISCORD_GUILD_ID=your_guild_id_here  # Optional: For guild-specific commands

# Webhook Configuration
ATHENA_DISCORD_WEBHOOK_URL=your_webhook_url_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=debug

# Paths
SHADOWFLOWER_PATH=C:\\Users\\sunny\\Saved Games\\ShadowFlowerCouncil
"@ | Out-File -FilePath .env -Encoding utf8
    
    Write-Host "✅ Created .env file. Please update it with your Discord bot credentials." -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists." -ForegroundColor Green
}

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Cyan
npm run build

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update the .env file with your Discord bot credentials"
Write-Host "2. Run 'npm run dev' to start the development server"
Write-Host "3. Run 'npx ts-node scripts/register-commands.ts' to register slash commands with Discord"
Write-Host ""
