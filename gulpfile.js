const { watch, parallel, series, src, dest } = require("gulp");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const sass = require("gulp-sass")(require("sass"));
const cache = require("gulp-cached");
const sassCache = require("gulp-cached-sass");
const autoPrefix = require("gulp-autoprefixer");
const sourceMap = require("gulp-sourcemaps");
const rename = require("gulp-rename");
const gulpif = require("gulp-if");
const del = require("del");
const fileInclude = require("gulp-file-include");
const compiler = require("webpack");
const webpackStream = require("webpack-stream");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const path = require("path");
const changed = require("gulp-changed");
const ttf2woff2 = require("gulp-ttftowoff2");
const ttf2woff = require("gulp-ttf2woff");
const favicons = require("favicons").stream;
const imagemin = require("gulp-imagemin");
const recompress = require("imagemin-jpeg-recompress");
const pngquant = require("imagemin-pngquant");
const bs = require("browser-sync");

// Переменная ENV, которая определяет запускаемые задачи и параметры
const ENV =
  process.env.NODE_ENV === "production" ? "production" : "development";

// Общие параметры для gulp
const params = {
  "outFolder": "", // Папка для исходящих файлов
  "listFiles": ["src/**/fonts/**/*.woff", "src/**/fonts/**/*.woff2"], // Список файлов, которые нужно просто перенести
  "css": {
    // Параметры для компиляции CSS
    "outputStyle": "", // Стиль сжатия для скомпилированго CSS файла
    "outFolderName": "css", // Определить директорию, куда нужно положить CSS файл (в случаии вложенности папки SCSS)
  },
  "sass": {
    "srcFolder": "src/scss", // Точная настройка папки для плагина gulp-cached-sass
  },
  "js": {
    "contextFolder": "src", // Настройка контекста для генерации js в Webpack (в случаии вложенности папки JS)
    "outFolderName": "js", // Определить директорию, куда нужно положить JS файл (в случаии вложенности папки JS)
  },
};

// Параметры для webpack-plugin
const webpackParams = {
  "mode": ENV,
  "context": path.resolve(__dirname, params.js.contextFolder),
  "entry": {
    "main": "./js/main.js",
  },
  "output": {
    "filename": "js/[name].bundle.js",
    "clean": true,
  },
  "devtool": ENV === "production" ? false : "eval-cheap-source-map",
};

// Параметры для работы сервера Browser Sync
const bsParams = {
  "server": "dist/",
  "browser": "chrome",
  "logPrefix": "BS-HTML:",
  "logLevel": "info",
  "logConnections": true,
  "logFileChanges": true,
  "open": false,
};

// Параметры для работы задачи по формированию favicon
const faviconParams = {
  "background": "#020307",
  "path": "favicons/",
  "scope": "/",
  "pipeHTML": false,
  "replace": false,
};

exports.compileStyles = compileStyles;
exports.compileHtml = compileHtml;
exports.compileScripts = compileScripts;
exports.convertFonts = convertFonts;
exports.createFavicon = createFavicon;
exports.destFiles = destFiles;
exports.imagesHandler = imagesHandler;
exports.browserSync = browserSync;
exports.watching = watching;
exports.clearFolder = clearFolder;

// Список базовый задач для обычной компиляции
const defaultTask = series(
  compileHtml,
  compileStyles,
  compileScripts,
  imagesHandler,
  destFiles,
);

// Список задача, которые "висят" и "обслуживают" gulp-конфиг
const serviceTask = parallel(watching, browserSync);

if (ENV === "development") {
  params.outFolder = "dist";
  params.css.outputStyle = "expanded";
  exports.default = series(clearFolder, defaultTask, serviceTask);
} else if (ENV === "production") {
  params.outFolder = "build";
  params.css.outputStyle = "compressed";
  exports.default = series(clearFolder, defaultTask);
}

// Задача для компляции общих стилей
function compileStyles() {
  return src(["src/**/*.scss"])
    .pipe(cache("sass"))
    .pipe(sassCache(path.resolve(__dirname, params.sass.srcFolder)))
    .pipe(gulpif(ENV === "development", sourceMap.init()))
    .pipe(
      sass({
        "outputStyle": params.css.outputStyle,
        "includePaths": ["node_modules"],
      }).on("error", sass.logError),
    )
    .pipe(autoPrefix())
    .pipe(
      rename({
        "dirname": params.css.outFolderName,
      }),
    )
    .pipe(gulpif(ENV === "development", sourceMap.write()))
    .pipe(dest(params.outFolder))
    .pipe(bs.stream());
}

// Задача для компиляции html-файлов
function compileHtml() {
  return src(["src/**/*.html", "!src/**/_*.html"])
    .pipe(
      fileInclude({
        "basepath": "@root",
      }),
    )
    .pipe(dest(params.outFolder))
    .pipe(bs.stream());
}

// Задача для очистки директории (в проде или разработке)
function clearFolder() {
  return del(params.outFolder);
}

// Задача для компиляции скриптов
function compileScripts(done) {
  src("src/**/js/**/*.js")
    .pipe(plumber(notify.onError("Error: <%= error.message %>")))
    .pipe(webpackStream(webpackParams, compiler))
    .pipe(gulpif(ENV === "production", babel()))
    .pipe(gulpif(ENV === "production", uglify()))
    .pipe(
      rename({
        "dirname": params.js.outFolderName,
      }),
    )
    .pipe(dest(params.outFolder))
    .pipe(bs.stream());

  done();
}

// Задача для конвертации шрифтов в формат woff и woff2
function convertFonts(done) {
  src(["src/**/fonts/**/*.ttf"]).pipe(ttf2woff2()).pipe(dest("src/"));

  src("src/**/fonts/**/*.ttf").pipe(ttf2woff()).pipe(dest("src/"));
  done();
}

// Задача для генерирования favicon
function createFavicon(done) {
  src("src/logo.png")
    .pipe(favicons(faviconParams))
    .on("error", (e) => {
      console.log("FAVICONS ERROR: ", e.message);
    })
    .pipe(dest(`${params.outFolder}/favicons`));

  done();
}

// Задача для оптимизации изображения
function imagesHandler(done) {
  if (ENV === "development") {
    src(["src/**/img/**/*.+(png|jpg|jpeg|gif|svg)", "!src/logo.png"])
      .pipe(dest(params.outFolder))
      .pipe(bs.stream());

    done();
  } else {
    src("src/**/img/**/*.+(png|jpg|jpeg|gif|svg|ico)")
      .pipe(plumber(notify.onError("Error: <%= error.message %>")))
      .pipe(changed(params.outFolder))
      .pipe(
        imagemin(
          {
            "interlaced": true,
            "progressive": true,
            "optimizationLevel": 5,
          },
          [
            recompress({
              "loops": 6,
              "min": 50,
              "max": 90,
              "quality": "high",
              "use": [
                pngquant({
                  "quality": [0.8, 1],
                  "strip": true,
                  "speed": 1,
                }),
              ],
            }),
            imagemin.gifsicle(),
            imagemin.optipng(),
            imagemin.svgo(),
          ],
        ),
      )
      .pipe(dest(params.outFolder))
      .pipe(bs.stream());

    done();
  }
}

// Задача для переноса файлов в списке
function destFiles() {
  return src(params.listFiles).pipe(dest(params.outFolder)).pipe(bs.stream());
}

// Задача watch для gulp
function watching() {
  watch(["src/**/*.scss"], parallel(compileStyles));
  watch(["src/**/*.js"], parallel(compileScripts));
  watch(["src/**/*.html"], parallel(compileHtml));
  watch("src/**/img/**/*.+(png|jpg|jpeg|gif|svg|ico)", parallel(imagesHandler));
  watch([...params.listFiles], parallel(destFiles));
}

// Задача для генерации сервера Browser Sync
function browserSync() {
  bs.init(bsParams);
}
