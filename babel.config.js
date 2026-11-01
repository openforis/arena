module.exports = function babelConfig(api) {
  // Cache the returned value forever and don't call this function again.
  //   api.cache(true);

  // If testing for a specific env, we recommend specifics to avoid instantiating a plugin for
  // any possible NODE_ENV value that might come up during plugin execution.
  global._isProd = api.cache(() => process.env.NODE_ENV === 'production')

  return {
    presets: [
      ['@babel/preset-env', { targets: { node: '12' } }],
      // Babel 8 keeps imports without the `type` keyword by default: they would load the imported modules at runtime
      ['@babel/preset-typescript', { onlyRemoveTypeImports: false }],
    ],
    // JSX syntax would otherwise also apply to .ts files, where it breaks generics like <T>(x: T) => x
    overrides: [{ exclude: /\.ts$/, presets: [['@babel/preset-react', { runtime: 'automatic' }]] }],
  }
}
