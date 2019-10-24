const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const nodeEnv = process.env.NODE_ENV;
const mainConfig = require('./webpack.config')

const isProduction = nodeEnv !== 'development';

// Common plugins
let plugins = [
    new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: JSON.stringify(nodeEnv),
        },
        '__ARENA_ROOT': JSON.stringify(__dirname),
        '__ARENA_DIST': JSON.stringify(path.resolve(path.join(__dirname), 'dist')),
    }),
    new webpack.NamedModulesPlugin()
];
if (!isProduction) {
    plugins.push(new webpack.HotModuleReplacementPlugin())
}
const entry = x => isProduction ? [
    'babel-polyfill',
    path.resolve(path.join(__dirname, x))
] : [
    'webpack/hot/poll?1000',
    'babel-polyfill',
    path.resolve(path.join(__dirname, x))
];

module.exports = {
    mode: 'development',
    devtool: false,
    externals: [
        nodeExternals({ whitelist: ['webpack/hot/poll?1000'] }),
        'worker_threads',
    ],
    //       externals: [
    //     nodeExternals(), 
    // ],
    name: 'server',
    plugins,
    target: 'node',
    entry: {
        server: entry('server/server.js'),
        jobThread: entry('server/job/jobThread.js'),
        recordUpdateThread: entry('server/modules/record/service/update/thread/recordUpdateThread.js'),
    },
    output: {
        publicPath: 'dist/',
        path: path.resolve(__dirname, './'),
        filename: 'dist/[id].js',
        libraryTarget: "commonjs2",
        hotUpdateChunkFilename: 'dist/hot-update.js',
        hotUpdateMainFilename: 'dist/hot-update.json'
    },
    resolve: {
        extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx'],
        modules: [
            path.resolve(__dirname, 'node_modules')
        ],
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
                        presets: ['@babel/env'],
                        plugins: ['@babel/plugin-proposal-object-rest-spread', '@babel/plugin-syntax-dynamic-import'],
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
    }
};
