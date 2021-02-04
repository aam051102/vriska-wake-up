"use strict";
const gutil = require("gulp-util");
const through = require("through2");
const fs = require("fs");

module.exports = function (options) {
    options = options || {};
    let importStack = {};
    const importJS = (path) => {
        if (!path) {
            return "";
        }

        const fileReg = /import\s["'](.*?)["']/gi;

        if (!fs.existsSync(path)) {
            throw new Error("file " + path + " no exist");
        }

        let content;

        if (path.endsWith(".png")) {
            content =
                "data:image/" +
                path.split(".").pop() +
                ";base64," +
                Buffer.from(fs.readFileSync(path), "binary").toString("base64");
        } else {
            content = fs.readFileSync(path, {
                encoding: "utf8",
            });
        }

        importStack[path] = path;

        content = content.replace(fileReg, (match, fileName) => {
            let importPath = fileName;

            if (importPath in importStack) {
                return "";
            }

            !options.hideConsole &&
                console.log('import "' + fileName + '" --> "' + path + '"');
            let importContent = importJS(importPath) || "";

            return importContent;
        });

        return content;
    };

    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            importStack = {};
            return;
        }

        if (file.isStream()) {
            cb(
                new gutil.PluginError(
                    "gulp-js-import",
                    "Streaming not supported"
                )
            );
            importStack = {};
            return;
        }

        let content;
        try {
            content = importJS(file.path);
        } catch (e) {
            cb(new gutil.PluginError("gulp-js-import", e.message));
            importStack = {};
            return;
        }

        file.contents = Buffer.from(content, "utf8");
        file.path = gutil.replaceExtension(file.path, ".js");
        !options.hideConsole && console.log("ImportJS finished.");
        cb(null, file);
        importStack = {};
    });
};
