const gulp = require('gulp');
const ts = require('gulp-typescript');

const tsObject = ts.createProject('./tsconfig.json');
const tsFileList = ['./*.ts', 'lib/*.ts', 'lib/**/*.js'];
/*
* transfer electron ts to js
*/

function compileTS() {
  gulp.src(tsFileList, { base: './lib' })
    .pipe(tsObject())
    .pipe(gulp.dest('./dist/'));
}

compileTS();

// gulp.watch(tsFileList, (event) => {
//   console.info('file changed');
//   compileTS();
// });
