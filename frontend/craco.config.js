// List of browser-compatible fallbacks for Node.js core modules
const fallbacks = {
    os: require.resolve("os-browserify/browser"),
    path: require.resolve("path-browserify"),
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer/"),
    assert: require.resolve("assert/"),
    util: require.resolve("util/"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    zlib: require.resolve("browserify-zlib"),
    fs: false, // Explicitly mark 'fs' as unsupported in the browser
};

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                ...fallbacks,
            };
            return webpackConfig;
        },
    },
};
