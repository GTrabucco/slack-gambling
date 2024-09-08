const path = require('path');
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    fs: false,
    os: require.resolve('os-browserify/browser'),
    path: require.resolve('path-browserify'),
    util: require.resolve('util/'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert/'),
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser'),
    crypto: require.resolve('crypto-browserify')
  };

  // Provide polyfills for global Node.js modules
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    })
  ]);

  return config;
};
