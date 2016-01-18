var webpack = require('webpack');
var path = require('path');
var extend = require('util')._extend;

var base = {
  context: __dirname,
  output: {
    filename: '[name].webpack.js',
    path: __dirname + '/public',
    publicPath: '/'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.styl$/, loader: 'style!css!stylus' },
      { test: /\.jade$/, loader: 'file?context=source/pages&name=[path]/[name].html!jade-html' },
      { test: /\.jpe?g$/, loader: 'url?name=[path][name].[hash:12].[ext]&limit=10000' }
    ]
  },
  jadeLoader: {
    basedir : './source',
    locals: {
      assetPath: function(asset) {
        return asset;
      }
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
  ]
};

var server = extend({
  target: 'node',
  entry: {
    'assets/javascripts/index': './source/index.js'
  },
}, base);

var client = extend({
  target: 'web',
  entry: {
    'assets/javascripts/package': './assets/package.js'
  }
}, base);

module.exports = [server, client];
