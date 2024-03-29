"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const path = require("path");
const webpack = require('webpack');
const buildConfig = require('@codification/cutwater-build-web').getConfig();
const isProduction = buildConfig.production;
const webpackConfiguration = {
    mode: isProduction ? 'production' : 'development',
    entry: {
        'etsyShopPoller': path.join(__dirname, buildConfig.srcFolder, 'lambda', 'EstyShopListingPollerHandler.ts')
    },
    output: {
        libraryTarget: 'umd',
        path: path.join(__dirname, buildConfig.distFolder),
        filename: `[name].js`,
        sourceMapFilename: "[name].js.map"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devtool: isProduction ? undefined : 'inline-source-map',
    optimization: {
        minimize: false,
    },
    target: 'node',
    externals: ['aws-sdk'],
    plugins: [new webpack.IgnorePlugin(/^electron$/)]
};
module.exports = webpackConfiguration;
