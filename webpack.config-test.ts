require('core-js/stable')
require('regenerator-runtime/runtime')

import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import { config as dotEnvConfig } from "dotenv"

dotEnvConfig();

// const ExtractTextPlugin = require('extract-text-webpack-plugin')
// const config = require("./webpack.config.js")
// config.target = "node"
// config.mode= 'development'
// module.exports = config
const config: webpack.Configuration = {
  // plugins: [new ExtractTextPlugin({filename: 'test-style.css'})],
  entry: ['core-js/stable', 'regenerator-runtime/runtime'],
  resolve: {
    modules: [
      "node_modules",
      // resolve(__dirname, "webapp")
    ],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  target: 'node', // in order to ignore built-in modules like path, fs, etc.
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  mode: 'development',
  node: {
    __filename: true,
    __dirname: true
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/env', '@babel/react', '@babel/typescript'],
            plugins: [
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-class-properties'
            ]
          }
        }
      },
      // {
      //   test: /\.less$/,
      //   use: ExtractTextPlugin.extract({
      //     fallback: 'style-loader',
      //     use: ['css-loader', 'less-loader']
      //   })
      // }
    ]
  },
  // plugins: [
  //   new webpack.DefinePlugin({
  //     'process.env.migrations_test_dirname': JSON.stringify(path.resolve(__dirname, 'server/db/migration/survey/migrations'))
  //   })
  // ]
}

export default config
