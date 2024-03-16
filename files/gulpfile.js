import gulp from 'gulp';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import include from 'gulp-include';
import uglify from 'gulp-uglify';
import { rmSync } from 'fs';

const sass = gulpSass(dartSass);
const { watch, series, parallel, src, dest, lastRun } = gulp;

const paths = {
  html: {
    in: ['./src/**/*.html', '!./src/inc/**/*'],
    out: './dist/',
  },
  js: {
    in: './src/scripts/**/*.{js,ts,jsx,tsx}',
    out: './dist/scripts',
  },
  styles: {
    in: './src/styles/**/*.{scss, css}',
    out: './dist/styles',
  },
  img: {
    in: './src/i/**/*.{gif,png,jpg,svg,webp}',
    out: './dist/i',
  },
  files: {
    in: ['./src/**/*.{txt,ico,mp3,woff,woff2,ttf,json,mp4,ogg,vtt}'],
    out: './dist/.',
  },
};

const styles = () => {
  return src(paths.styles.in, { sourcemaps: true })
    .pipe(include())
    .on('error', console.error)
    .pipe(sass())
    .pipe(dest(paths.styles.out, { sourcemaps: '.' }));
};

const js = () => {
  return src(paths.js.in, { sourcemaps: true })
    .pipe(uglify())
    .pipe(dest(paths.js.out, { sourcemaps: '.' }));
};

const img = () => {
  return src(paths.img.in, { since: lastRun(img) }).pipe(dest(paths.img.out));
};

const files = () => {
  return src(paths.files.in).pipe(dest(paths.files.out));
};

const html = () => {
  return src(paths.html.in)
    .pipe(include())
    .on('error', console.error)
    .pipe(dest(paths.html.out));
};

const clean = (cb) => {
  console.log('Purging `./dist` folder.');
  rmSync('./dist', { recursive: true, force: true });
  cb();
};

const methods = { html, styles, js, img, files };
const buildTask = series(clean, parallel(Object.values(methods)));
const watchAll = () => {
  Object.keys(methods).forEach((key) => {
    watch(paths[key].in, methods[key]);
  });
  watch('./src/inc/**/*', html);
};

const watchTask = series(buildTask, watchAll);

export { watchTask as default, buildTask as build };
