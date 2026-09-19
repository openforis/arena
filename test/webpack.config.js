const fs = require('fs')
const path = require('path')
const glob = require('glob')
const nodeExternals = require('webpack-node-externals')

const isEsmOnlyModule = (moduleName) => {
  const [first, second] = moduleName.split('/')
  const packageName = first.startsWith('@') ? `${first}/${second}` : first
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '..', 'node_modules', packageName, 'package.json'), 'utf8')
    )
    return packageJson.type === 'module'
  } catch {
    return false
  }
}

const getEntry = (type) =>
  // glob v13 requires forward slashes; path.resolve uses backslashes on Windows.
  glob
    .globSync(path.resolve(__dirname, type, 'tests', '*.{js,jsx,ts,tsx}').replace(/\\/g, '/'))
    .sort((fileA, fileB) => {
      const idxA = path.basename(fileA).substr(0, 3)
      const idxB = path.basename(fileB).substr(0, 3)
      if (idxA < idxB) return -1
      if (idxA > idxB) return 1
      return 0
    })

const getOutput = (type) => ({
  path: path.resolve(__dirname, '..', 'dist', '__tests__'),
  filename: `bundle.${type}.js`,
  publicPath: '/',
})

const getModule = () => ({
  rules: [
    {
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /(node_modules|bower_components)/,
      use: [{ loader: 'babel-loader', options: { cacheDirectory: true } }],
    },
  ],
})

const getResolve = () => ({
  extensions: [
    '.webpack-loader.js',
    '.web-loader.js',
    '.loader.js',
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.scss',
    '.sass',
    '.css',
  ],
  alias: {
    '@common': path.resolve(__dirname, '..', 'common/'),
    '@core': path.resolve(__dirname, '..', 'core/'),
    '@server': path.resolve(__dirname, '..', 'server/'),
    '@webapp': path.resolve(__dirname, '..', 'webapp/'),
    '@test': path.resolve(__dirname, '..', 'test/'),
  },
})

module.exports = (type) => ({
  entry: getEntry(type),
  target: 'node', // Ignore built-in modules like path, fs, etc.
  // Ignore all modules in node_modules folder, except the ESM-only ones: Jest can only require() ESM
  // natively on Node >= 24.9, so they are bundled (and transpiled) into the test bundle instead.
  externals: [nodeExternals({ allowlist: [isEsmOnlyModule] })],
  mode: 'development',
  devtool: 'source-map',
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '..', 'node_modules', '.cache', 'webpack-test', type),
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  output: getOutput(type),
  resolve: getResolve(),
  module: getModule(),
})
