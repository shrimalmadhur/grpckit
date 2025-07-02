#!/bin/bash

# Build script for GRPCKit

echo "Building GRPCKit..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the application
echo "Compiling TypeScript..."
npm run build

# Start the application
echo "Starting GRPCKit..."
npm start 