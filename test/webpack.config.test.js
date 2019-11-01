require('core-js/stable')
require('regenerator-runtime/runtime')
const nodeExternals = require('webpack-node-externals')
const mainConfig = require('../webpack.config')

require('dotenv').config()

module.exports = {
  entry: ['core-js/stable', 'regenerator-runtime/runtime'],
  target: 'node', // in order to ignore built-in modules like path, fs, etc.
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  mode: 'development',
  devtool: 'source-map',
  node: {
    __filename: true,
    __dirname: true
  },
  resolve: {
    alias: mainConfig.resolve.alias,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/env', '@babel/react'],
            plugins: ['@babel/plugin-proposal-object-rest-spread', '@babel/plugin-syntax-dynamic-import']
          }
        }
      },
    ]
  },
}
