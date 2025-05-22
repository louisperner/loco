# Getting a Developer ID Certificate for macOS App Distribution

This guide explains how to obtain and install a Developer ID certificate for signing and notarizing your macOS application.

## Prerequisites

1. An Apple Developer Program membership ($99/year)
2. Xcode installed on your Mac
3. Admin access to your Mac

## Step 1: Create a Certificate Signing Request (CSR)

1. Open the "Keychain Access" application (in Applications > Utilities)
2. From the menu, select Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority
3. Enter your email address and name
4. Select "Saved to disk" and click "Continue"
5. Save the CSR file (e.g., "CertificateSigningRequest.certSigningRequest") to your desktop

## Step 2: Request a Developer ID Certificate

1. Go to [Apple Developer Certificates page](https://developer.apple.com/account/resources/certificates/list)
2. Click the "+" button to add a new certificate
3. Under Software, select "Developer ID Application" and click "Continue"
4. Upload the CSR file you created in Step 1 and click "Continue"
5. Your Developer ID Application certificate will be generated
6. Download the certificate (it will be a .cer file)

## Step 3: Install the Certificate

1. Double-click the downloaded .cer file
2. It will be automatically added to your Keychain
3. Verify the certificate is installed by running:
   ```
   security find-identity -v -p codesigning
   ```
   You should see your Developer ID certificate in the list

## Step 4: Update Your .env File

Add your Developer ID certificate name to your .env file:

```
DEVELOPER_ID_APPLICATION="Developer ID Application: Your Name (XXXXXXXXXX)"
```

Replace "Your Name (XXXXXXXXXX)" with the exact text shown in the `security find-identity` command output.

## Step 5: Sign Your Application

Use the `sign-app.sh` script with the `developer_id` option:

```
./sign-app.sh ./out/loco-darwin-arm64/loco.app developer_id
```

## Step 6: Notarize Your Application

After signing with a Developer ID certificate, you can notarize your application:

```
./notarize-app.sh ./out/loco-signed.dmg
```

## Troubleshooting

If you encounter issues with the certificate:

1. Make sure your Apple Developer membership is active
2. Check that the certificate appears in Keychain Access (under "My Certificates")
3. Try restarting your Mac if the certificate doesn't show up
4. Make sure the certificate hasn't expired

For more information, see [Apple's documentation on Developer ID certificates](https://developer.apple.com/developer-id/). 