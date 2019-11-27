import * as path from 'path'
import * as webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import mainConfig from './webpack.config.babel'

const nodeEnv = process.env.NODE_ENV
const isProduction = nodeEnv === 'production'

// Common plugins
const plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    'process.env.ARENA_ROOT': JSON.stringify(__dirname),
    'process.env.ARENA_DIST': JSON.stringify(path.resolve(__dirname, 'dist')),
  }),
  new webpack.NamedModulesPlugin(),
  ...(isProduction ? [] : [new webpack.HotModuleReplacementPlugin()]),
]

const entry = entryPath => [
  ...(isProduction ? [] : ['webpack/hot/poll?1000']),
  'core-js/stable',
  'regenerator-runtime/runtime',
  path.resolve(path.join(__dirname, entryPath)),
]

export default {
  mode: 'development',
  devtool: isProduction ? false : 'source-map',
  externals: [
    nodeExternals({ whitelist: ['webpack/hot/poll?1000'] }),
    // 'worker_threads',
  ],
  name: 'server',
  plugins,
  target: 'node',
  entry: {
    server: entry('server/server.js'),
    jobThread: entry('server/job/jobThread.js'),
    recordUpdateThread: entry(
      'server/modules/record/service/update/thread/recordUpdateThread.js',
    ),
  },
  output: {
    publicPath: 'dist/',
    path: path.resolve(__dirname, './'),
    filename: 'dist/[id].js',
    // LibraryTarget: 'commonjs2',
    hotUpdateChunkFilename: 'dist/hot-update-[id].js',
    hotUpdateMainFilename: 'dist/hot-update-[hash].json',
  },
  resolve: {
    extensions: [
      '.webpack-loader.js',
      '.web-loader.js',
      '.loader.js',
      '.js',
      '.jsx',
    ],
    modules: [path.resolve(__dirname, 'node_modules')],
    alias: mainConfig.resolve.alias,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-syntax-dynamic-import',
            ],
          },
        },
      },
    ],
  },
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: true,
    __dirname: true,
  },
}
