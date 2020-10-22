import 'dotenv/config'
import path from 'path'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import GoogleFontsPlugin from 'google-fonts-plugin'
import GitRevisionPlugin from 'git-revision-webpack-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'

import { uuidv4 } from './core/uuid'
import * as ProcessUtils from './core/processUtils'

const { buildReport } = ProcessUtils.ENV
const fontCssFileName = 'woff2.css'

const isDevelopment = process.env.NODE_ENV !== 'production'

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

const gitRevisionPlugin = new GitRevisionPlugin()

// ==== init plugins
const plugins = [
  gitRevisionPlugin,
  new MiniCssExtractPlugin({
    filename: 'styles-[hash].css',
  }),
  new HtmlWebpackPlugin({
    template: './web-resources/index.html',
  }),
  new webpack.DefinePlugin({
    __BUST__: JSON.stringify(uuidv4()),
    process: {
      env: {
        NODE_ENV: JSON.stringify(ProcessUtils.ENV.nodeEnv),
        RSTUDIO_PROXY_SERVER_URL: JSON.stringify(process.env.RSTUDIO_PROXY_SERVER_URL),
        RSTUDIO_DOWNLOAD_SERVER_URL: JSON.stringify(process.env.RSTUDIO_DOWNLOAD_SERVER_URL),
        APPLICATION_VERSION: JSON.stringify(gitRevisionPlugin.version()),
        GIT_COMMIT_HASH: JSON.stringify(gitRevisionPlugin.commithash()),
        GIT_BRANCH: JSON.stringify(gitRevisionPlugin.branch()),
      },
    },
  }),
  new GoogleFontsPlugin({
    fonts: [
      {
        family: 'Montserrat',
        variants: ['200', '400', '600', '800'],
      },
    ],
    formats: ['woff2'],
    filename: fontCssFileName,
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
    filename: 'bundle-[hash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  devServer: {
    hot: true,
    index: '',
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
              url: (url) => {
                // Don't handle /img/ urls
                if (url.includes('/img/')) {
                  return false
                }

                return true
              },
              import: (url) => {
                // Don't handle font css file import
                if (url.includes(fontCssFileName)) {
                  return false
                }

                return true
              },
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
  plugins,
}

// If (prodBuild) {

webpack.optimization = {
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
}

export default webPackConfig
