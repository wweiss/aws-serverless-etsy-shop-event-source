"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const path = require("path");
const webpack = require('webpack');
const webpackTask = require('@codification/cutwater-build-webpack').webpack;
const isProduction = webpackTask.buildConfig.production;
const webpackConfiguration = {
    mode: isProduction ? 'production' : 'development',
    entry: {
        'etsyShopPoller': path.join(__dirname, webpackTask.buildConfig.libFolder, 'lambda', 'EstyShopListingPollerHandler.js')
    },
    output: {
        libraryTarget: 'umd',
        path: path.join(__dirname, webpackTask.buildConfig.distFolder),
        filename: `[name].js`,
        sourceMapFilename: "[name].js.map"
    },
    devtool: "source-map",
    externals: ['aws-sdk'],
    target: 'node',
    plugins: [new webpack.IgnorePlugin(/^electron$/)]
};
module.exports = webpackConfiguration;
