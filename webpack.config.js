var webpack = require('webpack');
var path = require('path');

module.exports = {

  entry: {
    'package': './assets/package.js'
  },

  output: {
    filename: '[name].webpack.js',
    path: path.resolve('./public/assets/javascripts')
  },
  
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.styl$/, loader: 'style!css!stylus' }
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin('common.webpack.js'),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
  ]

};
