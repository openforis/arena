const path = require('path')
const glob = require('glob')
const nodeExternals = require('webpack-node-externals')

const getEntry = (type) =>
  glob.globSync(path.resolve(__dirname, type, 'tests', '*.js')).sort((fileA, fileB) => {
    const idxA = fileA.substr(0, 3)
    const idxB = fileB.substr(0, 3)
    return idxA < idxB
  })

const getOutput = (type) => ({
  path: path.resolve(__dirname, '..', 'dist', '__tests__'),
  filename: `bundle.${type}.js`,
  publicPath: '/',
})

const getModule = () => ({
  rules: [
    {
      test: /\.(js|jsx)$/,
      exclude: /(node_modules|bower_components)/,
      use: [{ loader: 'babel-loader' }],
    },
  ],
})

const getResolve = () => ({
  extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx', '.scss', '.sass', '.css'],
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
  externals: [nodeExternals()], // Ignore all modules in node_modules folder
  mode: 'development',
  devtool: 'source-map',
  node: {
    __filename: true,
    __dirname: true,
  },
  output: getOutput(type),
  resolve: getResolve(),
  module: getModule(),
})
