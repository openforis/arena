import type { ConfigAPI, InputOptions } from '@babel/core'

// CommonJS (.cts): Babel loads its config synchronously (babel-jest), and Node doesn't have to guess the module type
module.exports = function babelConfig(api: ConfigAPI): InputOptions {
  // the config depends only on NODE_ENV: cache it per value
  api.cache(() => process.env.NODE_ENV === 'production')

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
