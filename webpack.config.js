var path = require('path');
var PATHS = {
    app: path.join(__dirname, 'src'),
    dist: path.join(__dirname, 'dist'),
};

var webpack = require('webpack');
var merge = require('webpack-merge');
var validate = require('webpack-validator');

var precss = require('precss');
var autoprefixer = require('autoprefixer');
var htmlPlug = require('html-webpack-plugin');

process.env.BROSWERSLIST = 'Last 2 versions, > 10%';

var common = {
    entry: {
        app: PATHS.app
    },
    output: {
        path: PATHS.dist,
        filename: '[name].js'
    },
    plugins: [new htmlPlug({
        template: './src/index.html'
    })]
};

var dev = {
    devServer: {
        historyApiFallback: true,
        hot: true,
        inline: true,
        stats: 'errors-only',
        host: process.env.HOST,   // default localhost
        port: process.env.PORT    // default 8080
    },
    output: {
        publicPath: '/dist/'
    },
    devtool: 'source-map',
    module: {
        loaders: [{
            test: /\.css$/,
            loader: 'style-loader!css-loader!postcss-loader'
        }]
    },
    postcss: function() {
        return [precss, autoprefixer]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin({
            multistep: true
        })
    ]
};

// for separate css
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var prod = {
    output: {
        publicPath: '/circles/',
    },
    module: {
        loaders: [{
            test: /\.css$/,
            loader: ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader')
        }]
    },
    postcss: function() {
        return [precss, autoprefixer]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: { drop_console: true }
        }),
        new webpack.optimize.OccurenceOrderPlugin,
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.AggressiveMergingPlugin(),
        new ExtractTextPlugin('style.css')
    ]
};


var config

switch(process.env.npm_lifecycle_event) {
    case 'build':
        config = merge(common, prod);
        break;
    default:
        config = merge(common, dev);
}

module.exports = validate(config);
