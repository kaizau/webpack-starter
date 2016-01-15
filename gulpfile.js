var webpack = require('webpack');
var webpackDevServer = require('webpack-dev-server');
var webpackConfig = require('./webpack.config.js');

var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var jade = require('gulp-jade');
var jadeInheritance = require('gulp-jade-inheritance');
var filter = require('gulp-filter');
var rename = require('gulp-rename');
var clean = require('gulp-clean');

gulp.task('default', ['clean', 'webpack-dev-server', 'compile-jade', 'watch']);
gulp.task('build', ['clean', 'compile-webpack', 'compile-jade']);

gulp.task('webpack-dev-server', function() {
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
    if (err) throw new gulpUtil.PluginError('webpack-dev-server', err);
  });
});

gulp.task('compile-jade', function() {
  gulp
    .src('source/**/*.jade')
    .pipe(jadeInheritance({basedir: 'source'}))
    .pipe(jade({basedir: 'source', locals: {}}))
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

gulp.task('watch', function() {
  gulp.watch('source/**/*.jade', ['compile-jade']);
});

gulp.task('clean', function() {
  gulp.src('public/**', {read: false})
    .pipe(clean());
});

gulp.task('compile-webpack', function(callback) {
  webpack(webpackConfig)
    .run(function (err, stats) {
      if (err) throw new gulpUtil.PluginError('webpack', err);
      callback();
    });
});
