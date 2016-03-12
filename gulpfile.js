var path = require('path');
var extend = require('util')._extend;
var webpack = require('webpack');
var webpackDevServer = require('webpack-dev-server');
var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var runSequence = require('run-sequence');
var jade = require('gulp-jade');
var jadeInheritance = require('gulp-jade-inheritance');
var data = require('gulp-data');
var rename = require('gulp-rename');
var clean = require('gulp-clean');


//
// Task Table
//
// Using runSequence until Gulp 4.0 introduces synchronous tasks.
//

gulp.task('default', function(done) {
  runSequence('clean', ['develop:jade', 'develop:webpack'], done);
});

gulp.task('package', function(done) {
  runSequence('clean', 'compile:webpack', ['compile:jade', 'compile:static'], done);
});

gulp.task('preview', ['package', 'serve']);


//
// Shared Settings
//

var sourceDir = 'source';
var assetsDir = 'assets';
var outputDir = 'public';

var webpackConfig = {
  entry: { 'javascripts/package': './assets/package.js' },
  output: {
    filename: '[name].webpack.js',
    path: path.join(__dirname, outputDir, assetsDir),
    publicPath: '/' + assetsDir + '/'
  },
  module: {
    loaders: [
      { test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/, loader: 'url?limit=5000&context=' + assetsDir + '&name=[path][name].[hash:12].[ext]' },
      { test: /\.(ttf|eot)$/, loader: 'file?context=' + assetsDir + '&name=[path][name].[hash:12].[ext]' },
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
  // Helper to rewrite asset hashes
  //
  // When compiling for production, jadeLocals.assetHash is set after
  // `compile:webpack`. Thus webpack compilation should precede jade.
  asset: function(file) {
    if (!jadeLocals.assetHash) return file;
    return file.replace('.webpack.', '.' + jadeLocals.assetHash + '.');
  },

  // Helper to generate unique classes for <body>
  bodyClass: function(current) {
    return 'Body' + current.replace(/(^|\W)\w/g, function(match) {
      return match.slice(1).toUpperCase();
    });
  }

  // jadeLocals.current
  // Current file name; set during compile:jade
};


//
// Development Tasks
//

gulp.task('develop:webpack', function(done) {
  Object.keys(webpackConfig.entry).forEach(function(key) {
    webpackConfig.entry[key] = [
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/dev-server',
      webpackConfig.entry[key]
    ]
  });
  webpackConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.optimize.CommonsChunkPlugin('javascripts/common.webpack.js')
  );

  var server = new webpackDevServer(webpack(webpackConfig), {
    contentBase: './' + outputDir,
    publicPath: '/' + assetsDir + '/',
    hot: true,
    stats: { colors: true }
  });

  server.listen(8080, 'localhost', function(err) {
    if (err) throw new gulpUtil.PluginError('develop:webpack', err);
    done();
  });
});

gulp.task('develop:jade', function() {
  gulp.start('compile:jade');
  gulp.start('compile:static');
  gulp.watch(path.join(sourceDir, '**/*.jade'), ['compile:jade']);
  gulp.watch(path.join(assetsDir, '{images,fonts}/**'), ['compile:static']);
});


//
// Production Tasks
//

var RewriteJadeAssetsPlugin = function() {
  return function() {
    this.plugin('done', function(stats) {
      jadeLocals.assetHash = stats.hash;
    });
  };
};

gulp.task('compile:webpack', function(done) {
  webpackConfig.output.filename = '[name].[hash].js';
  webpackConfig.plugins.push(
    new RewriteJadeAssetsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {NODE_ENV: JSON.stringify('production')}
    }),
    new webpack.optimize.CommonsChunkPlugin('javascripts/common.[hash].js'),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.NoErrorsPlugin()
  );

  webpack(webpackConfig).run(function(err, stats) {
    if (err) throw new gulpUtil.PluginError('compile:webpack', err);
    done();
  });
});

gulp.task('compile:jade', function() {
  return gulp.src(path.join(sourceDir, 'pages/**/*.jade'))
    .pipe(jadeInheritance({basedir: sourceDir}))
    .pipe(data(function(file){
      var name = file.relative.slice(5).slice(0, -5); // -pages -.jade
      return extend({
        current: name // Sets `current` var for each file
      }, jadeLocals);
    }))
    .pipe(jade({basedir: sourceDir}))
    .pipe(rename(function(file) {
      file.dirname = file.dirname.slice(5); // -pages
      if (file.basename != 'index' && file.basename != '404') {
        file.dirname = path.join(file.dirname, file.basename);
        file.basename = 'index';
      }
    }))
    .pipe(gulp.dest(outputDir));
});

gulp.task('compile:static', function() {
  return gulp.src(path.join(assetsDir, '{images,fonts}/**/**.*'))
    .pipe(rename(function(file) {
      file.dirname = path.join(assetsDir, file.dirname);
    }))
    .pipe(gulp.dest(outputDir));
});


//
// Utility
//

gulp.task('clean', function() {
  return gulp.src(path.join(outputDir, '*'), {read: false})
    .pipe(clean());
});

gulp.task('serve', function(done) {
  var express = require('express'); // from webpack-dev-server
  var server = express();
  server.use(express.static(outputDir));
  server.listen(8080, function(err){
    if (err) throw new gulpUtil.PluginError('serve', err);
    gulpUtil.log('Static server listening on http://localhost:8080');
    done();
  })
});
