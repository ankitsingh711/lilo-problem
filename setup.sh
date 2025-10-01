#!/bin/bash

# LILO Assignment Setup Script
# This script sets up the development environment for both frontend and backend

set -e

echo "🚀 Setting up LILO Assignment - MERN Stack Solution"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup server
echo "🖥️  Setting up server..."
cd server

if [ ! -f ".env" ]; then
    echo "📝 Creating server .env file..."
    cp .env.example .env
    echo "⚠️  Please edit server/.env with your configuration"
fi

echo "📦 Installing server dependencies..."
npm install

echo "🔨 Building server..."
npm run build

cd ..

# Setup client
echo "💻 Setting up client..."
cd client

echo "📦 Installing client dependencies..."
npm install

cd ..

# Check if MongoDB is running (optional)
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. You can start it with: brew services start mongodb/brew/mongodb-community"
        echo "   Or use Docker: docker run -d -p 27017:27017 mongo:6.0"
    fi
else
    echo "⚠️  MongoDB not found. Install it or use Docker: docker run -d -p 27017:27017 mongo:6.0"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development servers:"
echo "  npm run dev              # Start both frontend and backend"
echo "  npm run server:dev       # Start only backend"
echo "  npm run client:dev       # Start only frontend"
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
echo "To run tests:"
echo "  cd server && npm test    # Run backend tests"
echo "  cd client && npm test    # Run frontend tests"
echo ""
echo "📁 Sample CSV files are in: ./sample-data/"
echo ""
echo "Happy coding! 🚀"
