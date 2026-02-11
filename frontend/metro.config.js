const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig: getExpoDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const expoConfig = getExpoDefaultConfig(__dirname);

// Merge expo config with react-native config
const config = {
  resolver: {
    ...expoConfig.resolver,
    assetExts: [...(defaultConfig.resolver?.assetExts || []), ...(expoConfig.resolver?.assetExts || [])].filter((v, i, a) => a.indexOf(v) === i),
    sourceExts: [...(defaultConfig.resolver?.sourceExts || []), ...(expoConfig.resolver?.sourceExts || [])].filter((v, i, a) => a.indexOf(v) === i),
  },
  transformer: {
    ...expoConfig.transformer,
  },
};

module.exports = mergeConfig(defaultConfig, config);
