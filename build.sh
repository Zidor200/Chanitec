#!/bin/bash

# Print Node and NPM versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies with legacy peer deps
npm install --legacy-peer-deps

# Ensure react-scripts is available
if [ ! -f ./node_modules/.bin/react-scripts ]; then
  echo "react-scripts not found, installing explicitly..."
  npm install react-scripts@5.0.1 --save
fi

# Build the app with CI=false to ignore warnings
CI=false ./node_modules/.bin/react-scripts build
