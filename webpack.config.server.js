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
    }),
    new webpack.NamedModulesPlugin()
];
if (!isProduction) {
    plugins.push(new webpack.HotModuleReplacementPlugin())
}
const entry = isProduction ? [
    'babel-polyfill',
    path.resolve(path.join(__dirname, './server/server.js'))
] : [
    'webpack/hot/poll?1000',
    'babel-polyfill',
    path.resolve(path.join(__dirname, './server/server.js'))
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
    plugins: plugins,
    target: 'node',
    entry: entry,
    output: {
        publicPath: 'dist/',
        path: path.resolve(__dirname, './'),
        filename: 'dist/server.prod.js',
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
