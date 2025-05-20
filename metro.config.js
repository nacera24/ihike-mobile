// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts.push('cjs'); // nécessaire pour certains modules Firebase

// Ligne critique à ajouter pour corriger l'erreur "auth not registered"
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;



