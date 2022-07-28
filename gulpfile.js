const { series, parallel, src, watch, dest } = require("gulp");

const jshint = require("gulp-jshint");
const concat = require("gulp-concat");
const uglify = require("gulp-terser");
const rename = require("gulp-rename");
const merge = require("gulp-merge");
const shell = require("gulp-shell");
const del = require("del");
const jsdoc = require("gulp-jsdoc3");

tssrc = ["tmp/index.js"];
coresrc = [
  "3Dmol/3dmol.js",
  "3Dmol/WebGL/**.js",
  "3Dmol/**.js",
  "!3Dmol/SurfaceWorker.js",
  "3Dmol/SurfaceWorker.js",
];
extsrc = [
  "js/disable_amd.js",
  "js/mmtf.js",
  "node_modules/pako/dist/pako.js",
  "node_modules/netcdfjs/dist/netcdfjs.js",
  "node_modules/upng-js/UPNG.js",
];
uisrc = [
  "3Dmol/ui/ui.js",
  "3Dmol/ui/state.js",
  "3Dmol/ui/icon.js",
  "3Dmol/ui/form.js",
  "3Dmol/ui/defaultValues.js",
];
jqsrc = ["node_modules/jquery/dist/jquery.js"];

function clean(cb) {
  del("build/*.js");
  del(["doc/*"]);
  cb();
}

function doc(cb) {
  var config = require("./jsdoc.conf.json");
  return src(["3Dmol/*.js", "3Dmol/ui/*", "doc.md"], { read: false }).pipe(
    jsdoc(config, cb)
  );
}

function check() {
  return src(coresrc)
    .pipe(
      jshint({
        latedef: "nofunc",
        esversion: 6,
        laxbreak: true,
        undef: true,
        unused: true,
        globals: {
          $3Dmol: true,
          console: true, //set in webworker
          document: false,
          $: false,
          window: false,
          self: true, //for passing data to workers?
          module: false,
          Blob: false,
          pako: false,
          UPNG: false,
          netcdfjs: false,
          XMLHttpRequest: false,
          alert: false,
          setTimeout: false,
          clearTimeout: false,
          setInterval: false,
          clearInterval: false,
          Worker: false,
          MMTF: false,
          TextDecoder: false,
          FileReader: false,
          define: false,
          require: false,
        },
      })
    )
    .pipe(jshint.reporter("default"))
    .pipe(jshint.reporter("fail"));
}

function domin(srcs, name) {
  return src(srcs)
    .pipe(concat(name + ".js"))
    .pipe(dest("build"))
    .pipe(rename(name + "-min.js"))
    .pipe(
      uglify().on("error", function (e) {
        console.log(e);
      })
    )
    .pipe(dest("build"));
}

function minify() {
  return domin(
    jqsrc.concat(extsrc).concat(tssrc).concat(coresrc).concat(uisrc),
    "3Dmol"
  );
}

function minify_nojquery() {
  return domin(
    extsrc.concat(tssrc).concat(coresrc).concat(uisrc),
    "3Dmol-nojquery"
  );
}

function tests(cb) {
  src("tests/auto/generate_tests.py", { read: false }).pipe(
    shell("python3 <%= file.path %>")
  );
  cb();
}

function build_quick() {
  //nomin
  return src(jqsrc.concat(extsrc).concat(tssrc).concat(coresrc).concat(uisrc))
    .pipe(concat("3Dmol.js"))
    .pipe(dest("build"));
}

const webpack = shell.task("webpack --config webpack.config.js");
const tsdoc = shell.task("npx typedoc ./3Dmol/index.ts");


exports.build = series(check, webpack, parallel(tests, minify, minify_nojquery));
exports.default = series(clean, parallel(exports.build, doc, tsdoc));
exports.build_quick = series(webpack, parallel(build_quick, tests));
exports.clean = clean;
exports.doc = parallel(doc, tsdoc);
