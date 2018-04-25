const gulp = require('gulp');
const del = require('del');
const zip = require('gulp-zip');
const ts = require('gulp-typescript');
const install = require('gulp-install');

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', () => {
  const tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['scripts'], () => {
  gulp.watch('src/**/*.ts', ['scripts']);
});

gulp.task('package-lambda', ['scripts'], function() {
  gulp
    .src('./package.json')
    .pipe(gulp.dest('lambda-dist/'))
    .pipe(install({ production: true }));
  gulp.src('dist/**').pipe(gulp.dest('lambda-dist/'));
});

gulp.task('clean-lambda', function() {
  return del(['lambda-dist/']);
});

gulp.task('default', ['watch']);
