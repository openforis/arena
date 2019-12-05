import 'core-js/stable'
import 'regenerator-runtime/runtime'
import nodeExternals from 'webpack-node-externals'
import mainConfig from '../webpack.config.babel'

export default {
  entry: ['core-js/stable', 'regenerator-runtime/runtime'],
  target: 'node', // In order to ignore built-in modules like path, fs, etc.
  externals: [nodeExternals()], // In order to ignore all modules in node_modules folder
  mode: 'development',
  devtool: 'source-map',
  node: {
    __filename: true,
    __dirname: true,
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
            plugins: ['@babel/plugin-proposal-object-rest-spread', '@babel/plugin-syntax-dynamic-import'],
          },
        },
      },
    ],
  },
}
