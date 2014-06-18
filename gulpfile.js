var gulp = require('gulp');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');

gulp.task('mocha', function() {
  return gulp.src(['test/*.js'], { read: false })
    .pipe(mocha({reporter: 'spec'}))
    .on('error', gutil.log);
});

gulp.task('tdd', function() {

  gulp.start('mocha');
  
  gulp.watch(['lib/**', 'templates/**', 'test/**'])
    .on('change', function(file){
      gulp.src(['test/*.js'], { read: false })
        .pipe(mocha({reporter: 'spec'}))
        .on('error', gutil.log);

    });

});

gulp.task('default', ['mocha']);