const gulp = require('gulp');
const ts = require('gulp-typescript');

const argv = process.argv;
const tsObject = ts.createProject('./tsconfig.json');
const tsFileList = ['./lib/*.ts', './lib/*.js', './lib/**/*.ts', './lib/**/*.js'];

function compileTS() {
  gulp.src(tsFileList, { base: './lib' })
    .pipe(tsObject())
    .pipe(gulp.dest('./dist/'));
}

function watchTS() {
  gulp.watch(tsFileList, (event) => {
    console.info('file changed');
    compileTS();
  });
}

/*
* copy index.html
*/
function copyFiles() {
  gulp.src(['./lib/resource/*.pug'])
    .pipe(gulp.dest('./dist/resource'));
}

compileTS();
copyFiles();

if (argv.length > 2) {
  if (argv[2] === 'watch') {
    watchTS();
  }
}

