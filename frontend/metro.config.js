const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require("path");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");

const config = {
  watchFolders: [rootNodeModules],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, "node_modules"),
      rootNodeModules,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
