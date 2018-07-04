const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const webpack = require('webpack')
const uuidv4 = require('uuid/v4')

const mode = {
  development: 'development',
  production: 'production'
}
const prodBuild = process.env.NODE_ENV === mode.production

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
  )
]

const webPackConfig = {
  entry: ['babel-polyfill', './webapp/main.js'],
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
            presets: ['env', 'react'],
            // plugins: [require('babel-plugin-transform-object-rest-spread')]
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          prodBuild ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'sass-loader',
        ]
      }
    ]
  },
  plugins: plugins
}

if (prodBuild) {
  const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

  webpack.optimization = {
    minimizer: [
      new UglifyJsPlugin({
        parallel: true,
        uglifyOptions: {
          compress: true,
          output: {comments: false},
        },
        sourceMap: false
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  }

} else {
  webPackConfig.devtool = 'source-map'
}

module.exports = webPackConfig