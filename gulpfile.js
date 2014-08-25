var gulp = require('gulp');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var rimraf = require('gulp-rimraf');

gulp.task('test', ['clean-test'], function() {
  return gulp.src(['test/*.js'], { read: false })
    .pipe(mocha({reporter: 'spec'}))
    .on('error', gutil.log);
});

gulp.task('clean-test', function() {
	return gulp.src(['./generated'], {read: false})
		.pipe(rimraf());
});

gulp.task('tdd', function() {

  gulp.start('test');
  
  gulp.watch(['lib/**', 'templates/**', 'test/**'])
    .on('change', function(file){
      gulp.start('test');
    });

});

gulp.task('default', ['test']);