module.exports = function (api) {
  // Cache the returned value forever and don't call this function again.
  //   api.cache(true);

  // If testing for a specific env, we recommend specifics to avoid instantiating a plugin for
  // any possible NODE_ENV value that might come up during plugin execution.
  global._isProd = api.cache(() => process.env.NODE_ENV === 'production')

  return {
    presets: [['@babel/preset-env', { targets: { node: '12' } }], '@babel/react'],
    plugins: ['@babel/plugin-proposal-object-rest-spread', '@babel/plugin-syntax-dynamic-import'],
  }
}
