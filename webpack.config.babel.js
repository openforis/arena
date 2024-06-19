import 'dotenv/config'
import path from 'path'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import { GitRevisionPlugin } from 'git-revision-webpack-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'

import { uuidv4 } from './core/uuid'
import * as ProcessUtils from './core/processUtils'

const { buildReport } = ProcessUtils.ENV

const config = {
  mode: process.env.NODE_ENV || 'development',
  path: path.resolve(__dirname, 'dist'),
}

const isDevelopment = process.env.NODE_ENV !== 'production'

const gitRevisionPlugin = config.mode === 'production' ? null : new GitRevisionPlugin()

// Remove mini-css-extract-plugin log spam
// See: https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/97
class CleanUpStatsPlugin {
  // eslint-disable-next-line class-methods-use-this
  shouldPickStatChild(child) {
    return child.name.indexOf('mini-css-extract-plugin') !== 0
  }

  apply(compiler) {
    compiler.hooks.done.tap('CleanUpStatsPlugin', (stats) => {
      const { children } = stats.compilation
      if (Array.isArray(children)) {
        // eslint-disable-next-line no-param-reassign
        stats.compilation.children = children.filter((child) => this.shouldPickStatChild(child))
      }
    })
  }
}

// ==== init plugins
const plugins = [
  ...(gitRevisionPlugin ? [gitRevisionPlugin] : []),
  new MiniCssExtractPlugin({
    filename: 'styles-[fullhash].css',
    ignoreOrder: true,
  }),
  new HtmlWebpackPlugin({
    template: './web-resources/index.html',
  }),
  new webpack.DefinePlugin({
    __BUST__: JSON.stringify(uuidv4()),
    process: {
      env: {
        NODE_ENV: JSON.stringify(ProcessUtils.ENV.nodeEnv),
        RSTUDIO_DOWNLOAD_SERVER_URL: JSON.stringify(process.env.RSTUDIO_DOWNLOAD_SERVER_URL),
        APPLICATION_VERSION: gitRevisionPlugin
          ? JSON.stringify(gitRevisionPlugin.version())
          : JSON.stringify(process.env.APP_VERSION),
        RECAPTCHA_ENABLED: process.env.RECAPTCHA_ENABLED,
        RECAPTCHA_SITE_KEY: JSON.stringify(process.env.RECAPTCHA_SITE_KEY),
      },
    },
  }),
  new CleanUpStatsPlugin(),
]

if (isDevelopment) {
  plugins.push(new webpack.HotModuleReplacementPlugin())
  plugins.push(new ReactRefreshWebpackPlugin())
}

if (buildReport) {
  plugins.push(new BundleAnalyzerPlugin())
}

// ====== webpack config
const webPackConfig = {
  entry: ['./webapp/Main.js'],
  mode: ProcessUtils.ENV.nodeEnv,
  devtool: 'source-map',
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
    filename: 'bundle-[fullhash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  devServer: {
    hot: true,
    devMiddleware: {
      index: false, // specify to enable root proxying
    },
    proxy: [
      {
        // Proxy all server-served routes:
        context: ['/img', '/api', '/auth', '/socket.io', 'sockjs-node'],
        target: 'http://localhost:9090',
      },
      {
        context: ['/socket.io', 'sockjs-node'],
        target: 'ws://localhost:9090',
        ws: true,
      },
      // Proxy root to server to mirror the server routes (goes to /app/home currently)
      {
        context: '/',
        target: 'http://localhost:9090',
        // eslint-disable-next-line consistent-return
        bypass(req) {
          return req.path !== '/' ? '/index.html' : undefined
        },
      },
    ],
    compress: false,
    port: 9000,
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: isDevelopment ? [require.resolve('react-refresh/babel')] : [],
            },
          },
        ],
      },
      {
        test: /\.(sass|scss|css)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              url: {
                filter: (url) => {
                  // Don't handle /img/ urls
                  return !url.includes('/img/')
                },
              },
              import: {
                filter: (url) => {
                  return true
                },
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: 'file-loader',
      },
    ],
  },
  plugins,
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        parallel: true,
        uglifyOptions: {
          compress: true,
          output: { comments: false },
        },
        sourceMap: true,
      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
}

export default webPackConfig
