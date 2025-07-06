#!/bin/bash

# AthenaCore EC2 Deployment Script
# Deploys AthenaCore to the lilithos-server EC2 instance

set -e

# Configuration
EC2_IP="34.224.29.45"
EC2_USER="ec2-user"
PROJECT_NAME="AthenaCore"
DEPLOY_PATH="/home/ec2-user/athenacore"
PORT=8080

echo "🚀 Starting AthenaCore deployment to EC2..."

# Build the project locally
echo "📦 Building AthenaCore..."
npm run build

# Create deployment package
echo "📋 Creating deployment package..."
rm -rf deploy-package
mkdir deploy-package
cp -r dist/* deploy-package/
cp package.json deploy-package/
cp package-lock.json deploy-package/
cp tsconfig.json deploy-package/
cp README.md deploy-package/

# Create deployment script for EC2
cat > deploy-package/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 Setting up AthenaCore on EC2..."

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js 16 via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install 16
    nvm use 16
    nvm alias default 16
else
    # Check if we have the right Node.js version
    NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
    if [[ ! "$NODE_VERSION" =~ ^v16 ]] || [[ "$NODE_VERSION" == "unknown" ]]; then
        echo "📥 Updating to Node.js 16 via nvm..."
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
        # Remove any incompatible Node.js versions
        nvm uninstall 18 2>/dev/null || true
        nvm install 16
        nvm use 16
        nvm alias default 16
    fi
fi

# Load nvm for this session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 16

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << 'ENVEOF'
# AthenaCore Environment Configuration
NODE_ENV=production
PORT=8080

# Add your API keys here
# OPENAI_API_KEY=your_openai_api_key_here
# MISTRAL_API_KEY=your_mistral_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
# GOOGLE_API_KEY=your_google_api_key_here
# COHERE_API_KEY=your_cohere_api_key_here
# DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Redis configuration (optional)
# REDIS_URL=redis://localhost:6379

# Trading configuration (optional)
# OANDA_ACCOUNT_ID=your_oanda_account_id_here
ENVEOF
fi

# Stop existing PM2 process if running
pm2 stop athenacore 2>/dev/null || true
pm2 delete athenacore 2>/dev/null || true

# Start AthenaCore with PM2
echo "🚀 Starting AthenaCore with PM2..."
pm2 start main.js --name athenacore --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo "✅ AthenaCore deployment completed!"
echo "🌐 Access AthenaCore at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080"
echo "📊 PM2 Status: pm2 status"
echo "📋 PM2 Logs: pm2 logs athenacore"
EOF

chmod +x deploy-package/deploy.sh

# Create tar file for deployment
echo "📦 Creating deployment archive..."
tar -czf athenacore-deploy.tar.gz -C deploy-package .

# Deploy to EC2
echo "🚀 Deploying to EC2..."
scp -i ~/.ssh/athenacore-deploy-key.pem -o StrictHostKeyChecking=no athenacore-deploy.tar.gz ${EC2_USER}@${EC2_IP}:~/

# Execute deployment on EC2
echo "🔧 Executing deployment on EC2..."
ssh -i ~/.ssh/athenacore-deploy-key.pem -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} << 'REMOTE_SCRIPT'
set -e

echo "📦 Extracting deployment package..."
cd ~
rm -rf athenacore
mkdir athenacore
cd athenacore
tar -xzf ../athenacore-deploy.tar.gz

echo "🔧 Running deployment script..."
chmod +x deploy.sh
./deploy.sh

echo "🧹 Cleaning up..."
rm ../athenacore-deploy.tar.gz

echo "✅ Deployment completed successfully!"
REMOTE_SCRIPT

# Clean up local files
echo "🧹 Cleaning up local files..."
rm -rf deploy-package
rm athenacore-deploy.tar.gz

echo "🎉 AthenaCore deployment completed!"
echo "🌐 Access your application at: http://${EC2_IP}:${PORT}"
echo "📊 Check status: ssh ${EC2_USER}@${EC2_IP} 'pm2 status'"
echo "📋 View logs: ssh ${EC2_USER}@${EC2_IP} 'pm2 logs athenacore'" 