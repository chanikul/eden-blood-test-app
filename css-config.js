// CSS processing configuration for Next.js build
module.exports = {
  processCssUrls: true,
  cssModules: true,
  postCss: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
