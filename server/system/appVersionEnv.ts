// Imported first by the server entry point: exposes the app version resolved at build time as APP_VERSION env var,
// read by arena-server (an external module, not reachable by webpack's DefinePlugin) when it is loaded.
if (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) {
  process.env.APP_VERSION = __APP_VERSION__
}

export {}
