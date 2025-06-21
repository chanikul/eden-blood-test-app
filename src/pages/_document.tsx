import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Meta tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Eden Clinic - Blood Testing Services" />
        
        {/* Preconnect to domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
        {/* Script to ensure CSS files are loaded correctly */}
        <Script id="fix-css-paths" strategy="afterInteractive">
          {`
          (function() {
            // Function to fix CSS paths if they're not loading correctly
            function fixCssPaths() {
              const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
              stylesheets.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('/_next/static/css/') && !document.querySelector('style[data-fixed-from="' + href + '"]')) {
                  fetch(href)
                    .then(response => {
                      if (!response.ok) {
                        // If CSS file fails to load, try to load it from .next directory
                        const newHref = href.replace('/_next/static/css/', '/.next/static/css/');
                        console.log('Attempting to fix CSS path:', href, '->', newHref);
                        
                        // Create a new link element with the fixed path
                        const fixedLink = document.createElement('link');
                        fixedLink.rel = 'stylesheet';
                        fixedLink.href = newHref;
                        document.head.appendChild(fixedLink);
                      }
                    })
                    .catch(() => {
                      // Error handling
                      console.error('Failed to load CSS:', href);
                    });
                }
              });
            }
            
            // Run the fix when the page loads
            window.addEventListener('load', fixCssPaths);
            
            // Also run it now in case we're already loaded
            if (document.readyState === 'complete') {
              fixCssPaths();
            }
          })();
          `}
        </Script>
      </body>
    </Html>
  )
}
