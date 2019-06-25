const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
require('dotenv').config()
const uuidv4 = require('uuid/v4')

const mode = {
  development: 'development',
  production: 'production'
}

const prodBuild = process.env.NODE_ENV === mode.production
const buildReport = process.env.BUILD_REPORT === 'true'

const lastCommit = process.env.SOURCE_VERSION || 'N/A'
const versionString = lastCommit + '_' + new Date().toISOString()

// ==== init plugins
const plugins = [
  new MiniCssExtractPlugin({
    filename: 'styles-[hash].css'
  }),
  new HtmlWebpackPlugin({
    template: './web-resources/index.html'
  }),
  new webpack.DefinePlugin(
    {
      __SYSTEM_VERSION__: `"${versionString}"`,
      __BUST__: `"${uuidv4()}"`,
      __COGNITO_USER_POOL_ID__: JSON.stringify(process.env.COGNITO_USER_POOL_ID),
      __COGNITO_CLIENT_ID__: JSON.stringify(process.env.COGNITO_CLIENT_ID),
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      }
    }
  )
]

if (buildReport) {
  plugins.push(new BundleAnalyzerPlugin())
}

// ====== webpack config
const webPackConfig = {
  entry: ['@babel/polyfill', './webapp/main.js'],
  mode: prodBuild ? mode.production : mode.development,
  output: {
    filename: 'bundle-[hash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/env', '@babel/react'],
            plugins: ['@babel/plugin-proposal-object-rest-spread', '@babel/plugin-syntax-dynamic-import']
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          'css-loader',
          'sass-loader',
        ]
      }
    ]
  },
  plugins: plugins
}

// if (prodBuild) {

const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

webpack.optimization = {
  minimizer: [
    new UglifyJsPlugin({
      parallel: true,
      uglifyOptions: {
        compress: true,
        output: { comments: false },
      },
      sourceMap: true
    }),
    new OptimizeCSSAssetsPlugin({})
  ]
}

// }
// else {
webPackConfig.devtool = 'source-map'
// }

module.exports = webPackConfig
