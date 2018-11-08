const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const uuidv4 = require('uuid/v4')

const mode = {
  development: 'development',
  production: 'production'
}
module.exports = function (env = {}) {
  const prodBuild = env.production
  const report = env.report

  const lastCommit = process.env.SOURCE_VERSION || 'N/A'
  const versionString = lastCommit + '_' + new Date().toISOString()

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
        'process.env': {
          'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }
      }
    ),
  ]

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

  console.log(report)
// if (prodBuild) {
    if (report) {
      plugins.push(new BundleAnalyzerPlugin())
    }

    const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

    webpack.optimization = {
      minimizer: [
        new UglifyJsPlugin({
          parallel: true,
          uglifyOptions: {
            compress: true,
            output: {comments: false},
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

  return webPackConfig
}
