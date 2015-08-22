var fs     = require("fs"),
	Juicer = require("juicer"),
	gulp   = require("gulp"),
	less   = require("gulp-less"),
	path   = require('path');
 
Juicer.set('strip',false);

gulp.task('less', function(){
 	return gulp.src('./src/*.less')
	    .pipe(less())
	    .pipe(gulp.dest('./dest/'));
});

gulp.task("page",function(){
	var i18nConfig = JSON.parse(fs.readFileSync("./src/i18n.json",{encoding :"utf8"})),
		pageTpl    = Juicer(fs.readFileSync("./src/index.html",{encoding : "utf8"}) );

	// console.log(pageTpl);
	var pageCN = pageTpl.render(i18nConfig.cn),
		pageEN = pageTpl.render(i18nConfig.en);

	fs.writeFileSync("./cn/index.html",pageCN);
	fs.writeFileSync("./en/index.html",pageEN);

	fs.writeFileSync("./index.html",pageEN);
});

gulp.task("watch",function(){
	gulp.watch('./src/*', ['less','page']);
});

gulp.task("default",["less","page"],function(){

});