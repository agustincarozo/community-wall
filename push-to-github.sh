#!/bin/bash

# Script to commit and push community-wall to GitHub
# Run this after installing Xcode Command Line Tools

cd /Users/agustincarozo/community-wall

# Initialize git if not already initialized
if [ ! -d .git ]; then
    git init
fi

# Add all files
git add .

# Commit changes
git commit -m "Add community moodboard component with drag and drop, random rotation, and image fit options"

# Add remote repository (if not already added)
git remote add origin https://github.com/agustincarozo/community-wall.git 2>/dev/null || git remote set-url origin https://github.com/agustincarozo/community-wall.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main

echo "Done! Changes have been pushed to GitHub."

