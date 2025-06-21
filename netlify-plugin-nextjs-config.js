// Custom configuration for @netlify/plugin-nextjs
module.exports = {
  // Enable debug mode for troubleshooting
  debug: true,
  
  // Ensure CSS files are properly processed
  enableCssProcessing: true,
  
  // Ensure static assets are properly handled
  staticAssetCaching: true,
  
  // Don't minify HTML to help with debugging
  minifyHtml: false,
  
  // Force the plugin to include all CSS
  forceCssInclusion: true
};
