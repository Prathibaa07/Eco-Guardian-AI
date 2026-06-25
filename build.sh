#!/bin/bash
# Build script for Render Deployment
set -e

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm run build

echo "Returning to root..."
cd ..

echo "Installing backend dependencies..."
cd backend
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "Build complete."
