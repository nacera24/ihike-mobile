// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts.push('cjs'); // nécessaire pour certains modules Firebase


defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;



