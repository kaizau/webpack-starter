var path = require('path');
var webpack = require('webpack');
var webpackDevServer = require('webpack-dev-server');
var express = require('express'); // from webpack-dev-server

var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var runSequence = require('run-sequence');
var jade = require('gulp-jade');
var jadeInheritance = require('gulp-jade-inheritance');
var filter = require('gulp-filter');
var rename = require('gulp-rename');
var clean = require('gulp-clean');


//
// Task Table
// 
// Using runSequence until Gulp 4.0 introduces synchronous tasks.
//

gulp.task('default', ['develop']);

gulp.task('develop', function(done) {
  runSequence('clean', 'compile:jade', 'serve:dev', done);
});

gulp.task('compile', function(done) {
  runSequence('clean', 'compile:webpack', 'compile:jade', done);
});

gulp.task('serve', function(done) {
  runSequence('clean', 'compile', 'serve:static', done);
});


//
// Shared Settings
//

var webpackConfig = {
  entry: { 'package': './assets/package.js' },
  output: {
    filename: '[name].webpack.js',
    path: path.join(__dirname, 'public', 'assets', 'javascripts'),
    publicPath: '/assets/javascripts/'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.styl$/, loader: 'style!css!stylus' }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
  ]
};

var jadeLocals = {
  assetPath: function(asset) {
    if (!jadeLocals.assetHash) return asset;
    return asset.replace('.webpack.', '.' + jadeLocals.assetHash + '.');
  }
};


//
// Development Server
//

gulp.task('serve:dev', function(done) {
  gulp.watch('source/**/*.jade', ['compile-jade']);

  Object.keys(webpackConfig.entry).forEach(function(key) {
    webpackConfig.entry[key] = [
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/dev-server',
      webpackConfig.entry[key]
    ]
  });
  webpackConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.optimize.CommonsChunkPlugin('common.webpack.js')
  );

  var server = new webpackDevServer(webpack(webpackConfig), {
    contentBase: 'public',
    publicPath: '/assets/javascripts/',
    hot: true,
    stats: { colors: true }
  });

  server.listen(8080, 'localhost', function(err) {
    if (err) throw new gulpUtil.PluginError('start-dev-server', err);
    done();
  });
});


//
// Compile for Production
//

gulp.task('compile:webpack', function(done) {
  webpackConfig.output.filename = '[name].[hash].js';
  webpackConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env': {NODE_ENV: JSON.stringify('production')}
    }),
    new webpack.optimize.CommonsChunkPlugin('common.[hash].js'),
    function() {
      // Required to rewrite asset paths in Jade
      this.plugin('done', function(stats) {
        jadeLocals.assetHash = stats.hash;
      });
    },
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.NoErrorsPlugin()
  );

  webpack(webpackConfig)
    .run(function(err, stats) {
      if (err) throw new gulpUtil.PluginError('compile-webpack', err);
      done();
    });
});

gulp.task('compile:jade', function() {
  return gulp.src('source/**/*.jade')
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
  return gulp.src('public/**', {read: false})
    .pipe(clean());
});

gulp.task('serve:static', function(done) {
  var server = express();
  server.use(express.static('public'));
  server.listen(8080, function(err){
    if (err) throw new gulpUtil.PluginError('start-static-server', err);
    gulpUtil.log('Static server listening on http://localhost:8080');
    done();
  })
});
