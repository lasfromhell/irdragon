const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const uglify = require('gulp-uglify');
const streamify = require('gulp-streamify');
const sourcemaps = require('gulp-sourcemaps');
const buffer     = require('vinyl-buffer');
const gutil      = require('gulp-util');

gulp.task('build', function() {
    browserify({entries: 'application/app.jsx', extensions: ['.jsx'], debug: true})
        .transform(babelify, {sourceMaps: true})
        .bundle()
        .on('error', function(err) {
            console.error(err.stack);
            this.emit('end');
        })
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(streamify(uglify()))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('../chat/js'))
        .pipe(gutil.noop());

});

gulp.task('build-dev', function() {
    browserify({entries: 'application/app.jsx', extensions: ['.jsx'], debug: true})
        .transform(babelify)
        .bundle()
        .on('error', function(err) {
            console.error(err.stack);
            this.emit('end');
        })
        .pipe(source('bundle.js'))
        // .pipe(buffer())
        // .pipe(sourcemaps.init({loadMaps: true}))
        // .pipe(streamify(uglify()))
        // .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('../chat/js'))
        .pipe(gutil.noop());

});

gulp.task('notification-worker-dev', function() {
    browserify({entries: 'workers/notification-worker/worker.js', debug: true})
        .transform(babelify)
        .bundle()
        .on('error', function(err) {
            console.error(err.stack);
            this.emit('end');
        })
        .pipe(source('notification-worker.js'))
        // .pipe(buffer())
        // .pipe(sourcemaps.init({loadMaps: true}))
        // .pipe(streamify(uglify()))
        // .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('../chat/js'))
        .pipe(gutil.noop());
});

gulp.task('watch', function() {
    gulp.start('build');
    gulp.watch('application/**/*.jsx', ['build']);
});

gulp.task('watch-dev', function() {
    gulp.start('build-dev');
    gulp.start('notification-worker-dev');
    gulp.watch(['application/**/*.jsx'], ['build-dev']);
    gulp.watch(['workers/**/*.js'], ['notification-worker-dev']);
});

gulp.task('default', ['watch-dev']);