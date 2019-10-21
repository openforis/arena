import { resolve } from 'path'
import { DefinePlugin, Configuration } from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin, { loader as _loader } from 'mini-css-extract-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import GoogleFontsPlugin from 'google-fonts-plugin'

import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

import { config as dotEnvConfig } from "dotenv"
import uuidv4 from 'uuid/v4'

dotEnvConfig();
import { ENV } from './core/processUtils'

const buildReport = ENV.buildReport

const lastCommit = ENV.sourceVersion
const versionString = lastCommit + '_' + new Date().toISOString()

// ==== init plugins
const plugins = [
  new MiniCssExtractPlugin({
    filename: 'styles-[hash].css'
  }),
  new HtmlWebpackPlugin({
    template: './web-resources/index.html'
  }),
  new DefinePlugin({
    __SYSTEM_VERSION__: `"${versionString}"`,
    __BUST__: `"${uuidv4()}"`,
    'process': {
      'env': {
        'NODE_ENV': JSON.stringify(ENV.nodeEnv),
        'COGNITO_REGION': JSON.stringify(ENV.cognitoRegion),
        'COGNITO_USER_POOL_ID': JSON.stringify(ENV.cognitoUserPoolId),
        'COGNITO_CLIENT_ID': JSON.stringify(ENV.cognitoClientId),
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
  })
]

if (buildReport) {
  plugins.push(new BundleAnalyzerPlugin())
}

let mode: "development" | "production" | "none" = 'development'
if (ENV.nodeEnv === 'development' || ENV.nodeEnv === 'production' || ENV.nodeEnv === 'none') {
  mode = ENV.nodeEnv
} else {
  throw new Error(`Unknown nodeEnv: ${ENV.nodeEnv}`)
}

// ====== webpack config
const config: Configuration = {
  entry: [ resolve(__dirname, './webapp/main.tsx') ],
  mode,
  resolve: {
    modules: [
      "node_modules",
      // resolve(__dirname, "webapp")
    ],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  output: {
    filename: 'bundle-[hash].js',
    path: resolve(__dirname, 'dist'),
    publicPath: '/'
  },
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
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: _loader
          },
          'css-loader',
          'sass-loader',
        ]
      }
    ]
  },

  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  externals: {
    // "react": "React",
    // "react-dom": "ReactDOM"
  },

  plugins,

  devtool: 'source-map',
}

// if (prodBuild) {

// import UglifyJsPlugin from 'uglifyjs-webpack-plugin'


// }
// else {
// }

export default config
