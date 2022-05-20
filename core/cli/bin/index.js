#! /usr/bin/env node

const importLocal = require("import-local");

if (importLocal(__dirname)) {
  require("npmlog").info("yq-cli-dev", "正在使用 yq-cli 本地版本");
} else {
  require("../lib")(process.argv.slice("2"));
}
