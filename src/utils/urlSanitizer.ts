/**
 * Sanitizes URLs to prevent the app from loading itself recursively in WebViews.
 * This prevents infinite loops where the app attempts to load itself inside a WebView.
 * 
 * @param url - The URL to sanitize
 * @returns - A safe URL that won't create recursive app loading
 */
export const sanitizeUrl = (url: string): string => {
  // Get the current app URL (hostname and path)
  const appUrl = window.location.href;
  
  // Check if the URL is the same as the app or contains the app URL
  if (url === appUrl || url.includes(appUrl)) {
    console.warn('Blocked attempt to load app inside itself:', url);
    return 'about:blank'; // Return a safe blank page
  }
  
  // Check if URL is a local file URL that might load the app
  if (url.startsWith('file://') && url.includes('/index.html')) {
    console.warn('Blocked attempt to load local app file:', url);
    return 'about:blank';
  }
  
  // Check for other potential app URLs that might cause recursion
  const appUrlPattern = /loco:\/\//i;
  if (appUrlPattern.test(url)) {
    console.warn('Blocked attempt to load app URL:', url);
    return 'about:blank';
  }
  
  return url;
}; 