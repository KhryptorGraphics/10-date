#!/bin/bash

# Run backend tests
echo "Running backend tests..."
cd backend
npm test

# Run frontend tests
echo "Running frontend tests..."
cd ../frontend
npm test

# Run mobile tests
echo "Running mobile tests..."
cd ../10-date-mobile
npm test

echo "All tests completed!"
