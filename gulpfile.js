const gulp = require("gulp");
const minify = require("gulp-minify");
const jsImport = require("./mods/gulp-js-import");
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const connect = require("gulp-connect");
const sass = require("gulp-sass");
const babel = require("gulp-babel");
const imagemin = require("gulp-imagemin");
const cleanCSS = require("gulp-clean-css");
const jsonminify = require("gulp-jsonminify");
const htmlmin = require("gulp-htmlmin");
const gifFrames = require("gif-frames");
const fs = require("fs");
const path = require("path");
const { packImages } = require("./binpack");
const webpack = require("webpack-stream");

sass.compiler = require("node-sass");

function html(next) {
    gulp.src("./src/html/templates/*.ejs")
        .pipe(
            ejs().on("error", (err) => {
                console.error(err);
            })
        )
        .pipe(
            htmlmin({
                collapseWhitespace: true,
                collapseInlineTagWhitespace: true,
                removeTagWhitespace: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true,
                minifyURLs: true,
                collapseBooleanAttributes: true,
            })
        )
        .pipe(
            rename(function (path) {
                if (path.basename !== "index") {
                    path.dirname = path.basename;
                    path.basename = "index";
                }

                path.extname = ".html";
            })
        )
        .pipe(gulp.dest("./dist/"))
        .pipe(connect.reload());

    next();
}

function images(next) {
    packImages(
        "./src/assets/images/",
        "./dist/assets/atlases",
        2100,
        2100,
        1
    ).then(() => {
        console.log("Finished compressing all sprites into atlases.");
    });

    next();
}

function public(next) {
    gulp.src("./public/**/*.*")
        .pipe(gulp.dest("./dist/"))
        .pipe(connect.reload());

    next();
}

function imagesBuild(next) {
    packImages(
        "./src/assets/images/",
        "./temp/assets/atlases",
        2100,
        2100,
        1
    ).then(() => {
        console.log("Finished compressing all sprites into atlases.");

        gulp.src("./temp/assets/atlases/**/*.json")
            .pipe(gulp.dest("./dist/assets/atlases/"))
            .pipe(connect.reload());

        gulp.src("./temp/assets/atlases/**/*.png")
            .pipe(imagemin([imagemin.optipng({ optimizationLevel: 2 })]))
            .pipe(gulp.dest("./dist/assets/atlases/"))
            .pipe(connect.reload());
    });

    next();
}

function scss(next) {
    gulp.src("./src/css/**/*.scss")
        .pipe(sass().on("error", (err) => console.error(err)))
        .pipe(cleanCSS())
        .pipe(gulp.dest("./dist/assets/css"))
        .pipe(connect.reload());

    next();
}

function splitGifs(next) {
    // Handle gifs
    fs.mkdirSync("./temp/assets/images/", { recursive: true });

    const imageDirContents = fs.readdirSync("./src/assets/images/");
    imageDirContents.forEach((image) => {
        const extname = path.extname(image);
        const imageName = path.basename(image, extname);

        if (extname === ".gif") {
            gifFrames(
                {
                    url: `./src/assets/images/${image}`,
                    frames: "all",
                    outputType: "png",
                    cumulative: true,
                },
                (err) => {
                    if (err) {
                        throw err;
                    }
                }
            )
                .then((frameData) => {
                    frameData.forEach(async (frame) => {
                        frame
                            .getImage()
                            .pipe(
                                fs.createWriteStream(
                                    `./temp/assets/images/${imageName}-${frame.frameIndex}.png`
                                )
                            );
                    });
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    });

    next();
}

function jsBuild(next) {
    gulp.src("./src/js/templates/**/*.js")
        .pipe(jsImport().on("error", (err) => console.error(err)))
        .pipe(
            webpack({
                output: {
                    filename: "[name].js",
                    path: path.resolve("./dist/assets/js/"),
                    publicPath: "./assets/js/",
                },
                mode: "production",
            })
        )
        .pipe(
            babel({
                presets: ["@babel/preset-env"],
                plugins: [
                    ["minify-mangle-names", { topLevel: true, eval: true }],
                ],
            }).on("error", (err) => console.log(err))
        )
        .pipe(
            minify({
                ext: {
                    min: ".js",
                },
                noSource: true,
            }).on("error", (err) => console.error(err))
        )
        .pipe(gulp.dest("./dist/assets/js"))
        .pipe(connect.reload());

    next();
}

function js(next) {
    gulp.src("./src/js/templates/**/*.js")
        .pipe(jsImport().on("error", (err) => console.error(err)))
        .pipe(
            webpack({
                output: {
                    filename: "[name].js",
                    path: path.resolve("./dist/assets/js/"),
                    publicPath: "./assets/js/",
                },
                mode: "development",
            }).on("error", (err) => console.error(err))
        )
        .pipe(gulp.dest("./dist/assets/js"))
        .pipe(connect.reload());

    next();
}

function audio(next) {
    gulp.src("./src/assets/audio/*.mp3")
        .pipe(gulp.dest("./dist/assets/audio"))
        .pipe(connect.reload());

    next();
}

function fonts(next) {
    gulp.src("./src/assets/fonts/*.png")
        .pipe(imagemin([imagemin.optipng({ optimizationLevel: 7 })]))
        .pipe(gulp.dest("./dist/assets/fonts"))
        .pipe(connect.reload());

    gulp.src("./src/assets/fonts/*.json")
        .pipe(jsonminify())
        .pipe(gulp.dest("./dist/assets/fonts"))
        .pipe(connect.reload());

    next();
}

// Watchers
function watchHtml() {
    gulp.watch("./src/html/**/*.ejs", { ignoreInitial: false }, html);
}

function watchImages() {
    gulp.watch("./src/assets/images/**/*.*", { ignoreInitial: true }, images);
}

function watchPublic() {
    gulp.watch("./public/**/*.*", { ignoreInitial: false }, public);
}

function watchScss() {
    gulp.watch("./src/css/**/*.scss", { ignoreInitial: false }, scss);
}

function watchJs() {
    gulp.watch("./src/js/templates/**/*.js", { ignoreInitial: false }, js);
}

function watchAudio() {
    gulp.watch("./src/assets/audio/**/*.mp3", { ignoreInitial: false }, audio);
}
function watchFonts() {
    gulp.watch("./src/assets/fonts/**/*", { ignoreInitial: false }, fonts);
}

gulp.task("dev", function (next) {
    watchHtml();
    watchPublic();
    watchScss();
    watchJs();
    watchAudio();
    watchFonts();
    images(next);
    watchImages();
    connect.server({
        livereload: true,
        root: "dist",
    });

    next();
});

gulp.task("build", function (next) {
    fs.rmSync("./temp", { recursive: true });
    fs.rmSync("./dist", { recursive: true });

    jsBuild(next);
    scss(next);
    imagesBuild(next);
    public(next);
    audio(next);
    html(next);
    fonts(next);

    next();
});

gulp.task("split-gifs", function (next) {
    splitGifs(next);

    next();
});
