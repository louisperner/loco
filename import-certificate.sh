#!/bin/bash

# Script to import a Developer ID certificate
# Usage: ./import-certificate.sh /path/to/certificate.p12

set -e

if [ $# -lt 1 ]; then
  echo "Usage: $0 /path/to/certificate.p12"
  exit 1
fi

CERT_PATH="$1"

if [ ! -f "$CERT_PATH" ]; then
  echo "Error: Certificate not found at $CERT_PATH"
  exit 1
fi

echo "Importing certificate from $CERT_PATH..."
echo "You will be prompted for the certificate password if it has one."

# Import the certificate into the login keychain
security import "$CERT_PATH" -k ~/Library/Keychains/login.keychain-db

echo "Certificate imported successfully."
echo "Listing available signing identities:"
security find-identity -v -p codesigning

echo "Now you can update your .env file with the identity name."
echo "Look for a line like 'Developer ID Application: Your Name (XXXXXXXX)'"
echo "and add/update the APPLE_DEVELOPMENT_ID variable in .env" 