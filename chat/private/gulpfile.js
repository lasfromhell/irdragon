const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');

const swallowError = (error) => {
    console.log(error.toString());
    this.emit('end');
};

gulp.task('build', function() {
    browserify({entries: './app.jsx', extensions: ['.jsx'], debug: true})
        .transform(babelify)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('../chat/js'));
});

gulp.task('watch', ['build'], function() {
    gulp.watch('*.jsx', ['build'])
        .on('error', swallowError);
    gulp.watch('components/*.jsx', ['build'])
        .on('error', swallowError);
    gulp.watch('components/services/*.jsx', ['build'])
        .on('error', swallowError);
    gulp.watch('components/utils/*.jsx', ['build'])
        .on('error', swallowError);
});

gulp.task('default', ['watch']);