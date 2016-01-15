var path = require('path');
var webpack = require('webpack');
var webpackDevServer = require('webpack-dev-server');
var express = require('express'); // from webpack-dev-server

var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var jade = require('gulp-jade');
var jadeInheritance = require('gulp-jade-inheritance');
var filter = require('gulp-filter');
var rename = require('gulp-rename');
var clean = require('gulp-clean');


//
// Task Table
//

gulp.task('default', ['develop']);
gulp.task('develop', ['clean', 'start-dev-server', 'compile-jade', 'watch']);
gulp.task('compile', ['clean', 'compile-webpack', 'compile-jade']);
gulp.task('serve', ['compile', 'start-static-server']);


//
// Shared Settings
//

var webpackConfig = {
  entry: { 'package': './assets/package.js' },
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

var jadeLocals = {};


//
// Development Server
//

gulp.task('start-dev-server', function() {
  Object.keys(webpackConfig.entry).forEach(function(key) {
    webpackConfig.entry[key] = [
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/dev-server',
      webpackConfig.entry[key]
    ]
  });
  webpackConfig.output.publicPath = '/assets/javascripts/';
  webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

  var server = new webpackDevServer(webpack(webpackConfig), {
    contentBase: 'public',
    publicPath: '/assets/javascripts/',
    hot: true,
    stats: { colors: true }
  });

  server.listen(8080, 'localhost', function(err) {
    if (err) throw new gulpUtil.PluginError('start-dev-server', err);
  });
});

gulp.task('watch', function() {
  gulp.watch('source/**/*.jade', ['compile-jade']);
});


//
// Compile
//

gulp.task('compile-webpack', function(callback) {
  webpackConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env': {NODE_ENV: JSON.stringify('production')}
    }),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.NoErrorsPlugin()
  );

  webpack(webpackConfig)
    .run(function(err, stats) {
      if (err) throw new gulpUtil.PluginError('compile-webpack', err);
      callback();
    });
});

gulp.task('compile-jade', function() {
  gulp.src('source/**/*.jade')
    .pipe(jadeInheritance({basedir: 'source'}))
    .pipe(jade({basedir: 'source', locals: jadeLocals}))
    .pipe(filter(function(file) {
      return !/^(layouts|partials)\//.test(file.relative);
    }))
    .pipe(rename(function(path){
      if (path.dirname.substring(0, 5) === 'pages') {
        path.dirname = path.dirname.slice(5);
      }
    }))
    .pipe(gulp.dest('public'));
});


//
// Utility
//

gulp.task('clean', function() {
  gulp.src('public/**', {read: false})
    .pipe(clean());
});

gulp.task('start-static-server', function() {
  var server = express();
  server.use(express.static('public'));
  server.listen(8080, function(err){
    if (err) throw new gulpUtil.PluginError('start-static-server', err);
    gulpUtil.log('Static server listening on http://localhost:8080');
  })
});
