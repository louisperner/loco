#!/bin/bash

# Script to notarize a macOS application after signing
# Usage: ./notarize-app.sh path/to/app.dmg

set -e

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

if [ $# -lt 1 ]; then
  echo "Usage: $0 path/to/app.dmg"
  exit 1
fi

DMG_PATH="$1"

if [ ! -f "$DMG_PATH" ]; then
  echo "Error: DMG not found at $DMG_PATH"
  exit 1
fi

# Set credentials from .env if available
APPLE_ID="${APPLE_ID:-$APPLE_ID}"
APPLE_TEAM_ID="${APPLE_TEAM_ID:-$APPLE_TEAM_ID}"
APPLE_APP_PASSWORD="${APPLE_ID_PASSWORD:-$APPLE_APP_PASSWORD}"

# Check for required environment variables
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_TEAM_ID" ] || [ -z "$APPLE_APP_PASSWORD" ]; then
  echo "Please set the following environment variables in your .env file or export them:"
  echo "  APPLE_ID=\"your.apple.id@example.com\""
  echo "  APPLE_TEAM_ID=\"XXXXXXXXXX\""
  echo "  APPLE_ID_PASSWORD or APPLE_APP_PASSWORD=\"xxxx-xxxx-xxxx-xxxx\" # App-specific password for notarization"
  exit 1
fi

echo "Using the following credentials for notarization:"
echo "  Apple ID: $APPLE_ID"
echo "  Team ID: $APPLE_TEAM_ID"

# Submit for notarization and get the submission ID
echo "Submitting app for notarization..."
NOTARIZATION_OUTPUT=$(xcrun notarytool submit "$DMG_PATH" \
  --apple-id "$APPLE_ID" \
  --team-id "$APPLE_TEAM_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --wait)

echo "$NOTARIZATION_OUTPUT"

# Extract the submission ID from the output
SUBMISSION_ID=$(echo "$NOTARIZATION_OUTPUT" | grep -i "id:" | head -n 1 | awk '{print $2}')

if [ -z "$SUBMISSION_ID" ]; then
  echo "Failed to extract submission ID from notarytool output"
  exit 1
fi

echo "Submission ID: $SUBMISSION_ID"

# Check notarization status using the submission ID
echo "Checking notarization status..."
xcrun notarytool info "$SUBMISSION_ID" \
  --apple-id "$APPLE_ID" \
  --team-id "$APPLE_TEAM_ID" \
  --password "$APPLE_APP_PASSWORD"

# Check if the notarization was successful
STATUS=$(xcrun notarytool info "$SUBMISSION_ID" \
  --apple-id "$APPLE_ID" \
  --team-id "$APPLE_TEAM_ID" \
  --password "$APPLE_APP_PASSWORD" | grep -i "status:" | awk '{print $2}')

if [ "$STATUS" != "Accepted" ]; then
  echo "Notarization failed with status: $STATUS"
  echo "Check the log for details"
  xcrun notarytool log "$SUBMISSION_ID" \
    --apple-id "$APPLE_ID" \
    --team-id "$APPLE_TEAM_ID" \
    --password "$APPLE_APP_PASSWORD" notarization.log
  
  echo "Log saved to notarization.log"
  cat notarization.log
  exit 1
fi

# Staple the notarization ticket to the DMG
echo "Stapling notarization ticket to DMG..."
xcrun stapler staple "$DMG_PATH"

echo "Notarization complete!"
echo "Your notarized DMG is at: $DMG_PATH" 