const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlReplaceWebpackPlugin = require('html-replace-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const GoogleFontsPlugin = require('google-fonts-plugin')
const GitRevisionPlugin = require('git-revision-webpack-plugin')

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
require('dotenv').config()
const uuidv4 = require('uuid/v4')

const ProcessUtils = require('./core/processUtils')

const buildReport = ProcessUtils.ENV.buildReport

// Remove mini-css-extract-plugin log spam
// See: https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/97
class CleanUpStatsPlugin {
  shouldPickStatChild (child) {
    return child.name.indexOf('mini-css-extract-plugin') !== 0
  }

  apply (compiler) {
    compiler.hooks.done.tap('CleanUpStatsPlugin', (stats) => {
      const children = stats.compilation.children
      if (Array.isArray(children)) {
        // eslint-disable-next-line no-param-reassign
        stats.compilation.children = children
          .filter(child => this.shouldPickStatChild(child))
      }
    })
  }
}

const gitRevisionPlugin = new GitRevisionPlugin()

// ==== init plugins
const plugins = [
  gitRevisionPlugin,
  new MiniCssExtractPlugin({
    filename: 'styles-[hash].css'
  }),
  new HtmlWebpackPlugin({
    template: './web-resources/index.html'
  }),
  new HtmlReplaceWebpackPlugin([
    {
      pattern: '$COGNITO_USER_POOL_ID',
      replacement: ProcessUtils.ENV.cognitoUserPoolId
    },
    {
      pattern: '$COGNITO_CLIENT_ID',
      replacement: ProcessUtils.ENV.cognitoClientId
    },
  ]),
  new webpack.DefinePlugin({
    __BUST__: JSON.stringify(uuidv4()),
    'process': {
      'env': {
        'NODE_ENV': JSON.stringify(ProcessUtils.ENV.nodeEnv),
        'COGNITO_REGION': JSON.stringify(ProcessUtils.ENV.cognitoRegion),
        'COGNITO_USER_POOL_ID': JSON.stringify(ProcessUtils.ENV.cognitoUserPoolId),
        'COGNITO_CLIENT_ID': JSON.stringify(ProcessUtils.ENV.cognitoClientId),
        'APPLICATION_VERSION': JSON.stringify(gitRevisionPlugin.version()),
        'GIT_COMMIT_HASH': JSON.stringify(gitRevisionPlugin.commithash()),
        'GIT_BRANCH': JSON.stringify(gitRevisionPlugin.branch()),
        }
    }
  }),
  new GoogleFontsPlugin({
    fonts: [{
      family: 'Montserrat',
      variants: ['200', '400', '600', '800']
    }],
    formats: [
      'woff2'
    ]
  }),
  new CleanUpStatsPlugin(),
]

if (buildReport) {
  plugins.push(new BundleAnalyzerPlugin())
}

// ====== webpack config
const webPackConfig = {
  entry: ['./webapp/main.js'],
  mode: ProcessUtils.ENV.nodeEnv,
  resolve: {
    extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx', '.scss', '.sass', '.css'],
    alias: {
      '@common': path.resolve(__dirname, 'common/'),
      '@core': path.resolve(__dirname, 'core/'),
      '@server': path.resolve(__dirname, 'server/'),
      '@webapp': path.resolve(__dirname, 'webapp/'),
      '@test': path.resolve(__dirname, 'test/'),
    },
  },
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
      },
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
