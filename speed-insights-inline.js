// Vercel Speed Insights - Inline initialization script
// This is an inline version extracted from @vercel/speed-insights v2.0.0
// It will automatically load the Speed Insights tracking script when deployed to Vercel

(function() {
  'use strict';
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  // Initialize the Speed Insights queue
  if (!window.si) {
    window.si = function(...params) {
      window.siq = window.siq || [];
      window.siq.push(params);
    };
  }
  
  // Don't inject multiple times
  const scriptSrc = '/_vercel/speed-insights/script.js';
  if (document.head.querySelector(`script[src*="${scriptSrc}"]`)) return;
  
  // Create and inject the Speed Insights script
  const script = document.createElement('script');
  script.src = scriptSrc;
  script.defer = true;
  
  // Add SDK metadata
  script.dataset.sdkn = '@vercel/speed-insights';
  script.dataset.sdkv = '2.0.0';
  
  // Error handler
  script.onerror = function() {
    console.log(
      '[Vercel Speed Insights] Failed to load script from ' + scriptSrc + 
      '. Please check if any content blockers are enabled and try again.'
    );
  };
  
  // Inject the script into the page
  document.head.appendChild(script);
})();
