// Netlify configuration to bypass Python requirements
module.exports = {
  build: {
    environment: {
      // Disable Python completely
      PYTHON_VERSION: "0",
      NODE_GYP_FORCE_PYTHON: "false",
      NPM_CONFIG_PYTHON: "false",
      SKIP_PYTHON: "true",
      
      // NPM configuration
      NPM_CONFIG_IGNORE_SCRIPTS: "true",
      NPM_CONFIG_OPTIONAL: "false",
      NPM_CONFIG_FUND: "false",
      NPM_CONFIG_AUDIT: "false",
      NPM_CONFIG_ENGINE_STRICT: "false",
      NPM_CONFIG_LEGACY_PEER_DEPS: "true",
      NPM_CONFIG_PRODUCTION: "false",
    },
    command: "npm install --no-optional --ignore-scripts && npm run netlify-build",
    publish: ".next"
  }
};
