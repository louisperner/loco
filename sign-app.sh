#!/bin/bash

# Script to sign a macOS application after it's been built
# Usage: ./sign-app.sh [optional: path to app] [optional: developer_id|development]

set -e

CERT_TYPE="${2:-development}"

# Load environment variables from .env file safely
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  # Read the .env file line by line to handle special characters
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and empty lines
    [[ $line =~ ^#.*$ ]] && continue
    [[ -z $line ]] && continue
    
    # Extract variable name and value
    if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      # Remove quotes if present
      value="${value%\"}"
      value="${value#\"}"
      value="${value%\'}"
      value="${value#\'}"
      # Export the variable
      export "$key=$value"
    fi
  done < .env
else
  echo "Warning: .env file not found"
fi

# Default app path - adjust if your app is in a different location
APP_PATH="${1:-./out/loco-darwin-arm64/loco.app}"

# Check if app exists
if [ ! -d "$APP_PATH" ]; then
  echo "Error: App not found at $APP_PATH"
  echo "Please build the app first using 'npm run make' or specify the path"
  exit 1
fi

# Use specified certificate type
if [ "$CERT_TYPE" = "developer_id" ]; then
  echo "Using Developer ID Application certificate for distribution signing"
  
  # Check available Developer ID certificates
  DEVELOPER_IDS=$(security find-identity -v -p codesigning | grep "Developer ID Application")
  if [ -z "$DEVELOPER_IDS" ]; then
    echo "No Developer ID Application certificates found!"
    echo "You need a Developer ID certificate for distribution"
    echo "You currently only have:"
    security find-identity -v -p codesigning
    exit 1
  fi
  
  echo "Available Developer ID certificates:"
  echo "$DEVELOPER_IDS"
  
  if [ -n "$DEVELOPER_ID_APPLICATION" ]; then
    IDENTITY="$DEVELOPER_ID_APPLICATION"
    echo "Using Developer ID from environment: $IDENTITY"
  else
    echo "Enter the name of your Developer ID Application certificate (include the entire string):"
    read IDENTITY
    
    if [ -z "$IDENTITY" ]; then
      echo "No identity provided. Cannot sign the application."
      exit 1
    fi
  fi
else
  echo "Using Development certificate for local testing"
  # Use Apple Development ID from .env if available
  if [ -n "$APPLE_DEVELOPMENT_ID" ]; then
    IDENTITY="$APPLE_DEVELOPMENT_ID"
    echo "Using identity from .env file: $IDENTITY"
  else
    # Developer identity for local testing
    echo "Available signing identities:"
    security find-identity -v -p codesigning

    echo "Enter the name of your Apple Development certificate:"
    echo "(Look for a line containing 'Apple Development: Your Name (XXXXXXXXXX)')"
    read IDENTITY

    if [ -z "$IDENTITY" ]; then
      echo "No identity provided. Cannot sign the application."
      exit 1
    fi
  fi
fi

echo "Signing app with identity: $IDENTITY"

# Remove quarantine attribute if it exists
echo "Removing quarantine attribute..."
xattr -d com.apple.quarantine "$APP_PATH" 2>/dev/null || true

# First, sign all the helper apps and frameworks inside the app bundle
echo "Signing nested components..."
find "$APP_PATH/Contents/Frameworks" -type f -name "*.dylib" -o -name "*.so" -o -path "*/MacOS/*" | while read -r file; do
  echo "Signing $file"
  codesign --force --options runtime --timestamp --entitlements "./entitlements.plist" --sign "$IDENTITY" "$file" --verbose
done

# Find and sign all framework bundles
find "$APP_PATH/Contents/Frameworks" -type d -name "*.framework" -o -name "*.app" | while read -r framework; do
  echo "Signing framework/helper app: $framework"
  codesign --force --options runtime --timestamp --entitlements "./entitlements.plist" --sign "$IDENTITY" "$framework" --verbose
done

# Now sign the main application bundle
echo "Signing main application bundle..."
codesign --force --options runtime --timestamp --entitlements "./entitlements.plist" --sign "$IDENTITY" "$APP_PATH" --deep --verbose

echo "Creating a DMG file..."
DMG_PATH="./out/loco-signed.dmg"
hdiutil create -volname "Loco" -srcfolder "$APP_PATH" -ov -format UDZO "$DMG_PATH"

# Sign the DMG
echo "Signing DMG file..."
codesign --force --timestamp --sign "$IDENTITY" "$DMG_PATH" --verbose

echo "Verifying signature..."
codesign --verify --verbose "$APP_PATH"
codesign --verify --verbose "$DMG_PATH"

echo "Done! Your signed application is at $APP_PATH"
echo "Your signed DMG is at $DMG_PATH"
echo ""

if [ "$CERT_TYPE" = "developer_id" ]; then
  echo "Since you used a Developer ID certificate, your app can be notarized for distribution."
  echo "To notarize the app, run: ./notarize-app.sh $DMG_PATH"
else
  echo "You used a Development certificate, which is good for local testing but not for distribution."
  echo "For distribution, use a Developer ID certificate:"
  echo "./sign-app.sh [path] developer_id"
fi 