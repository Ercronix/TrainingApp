module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            // transformImportMeta: zustand/middleware's web (ESM) build uses import.meta, which
            // otherwise breaks the non-module web bundle with a white screen
            ["babel-preset-expo", { jsxImportSource: "nativewind", unstable_transformImportMeta: true }],
            "nativewind/babel",
        ],
    };
};