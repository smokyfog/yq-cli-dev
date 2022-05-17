"use strict";

const path = require("path");
const Package = require("@yq-cli-dev/package");
const log = require("@yq-cli-dev/log");
const { exec: spawn } = require("@yq-cli-dev/utils");

const SETTINGS = {
  init: "@imooc-cli/init",
  publish: "@yq-cli/publish",
};

const CACHE_DIR = "dependencies";

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = "";
  let pkg;
  log.verbose("targetPath", targetPath);
  log.verbose("homePath", homePath);

  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = "1.1.0";

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存路径

    storeDir = path.resolve(targetPath, "node_modules");
    log.verbose("targetPath", targetPath);
    log.verbose("storeDir", storeDir);
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
    if (await pkg.exists()) {
      console.log("更新");
      // 更新package
      await pkg.update();
    } else {
      console.log("安装");
      // 安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const rootFile = pkg.getRootFilePath();
  console.log("rootFile", rootFile);
  if (rootFile) {
    try {
      // 1. 在当前进程中调用
      // require(rootFile).call(null, Array.from(arguments));
      // 2. 在node子进程中调用
      const args = Array.from(arguments);
      const cmd = args[args.length - 1];
      const o = Object.create(null);
      Object.keys(cmd).forEach((key) => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith("_") &&
          key !== "parent"
        ) {
          o[key] = cmd[key];
        }
      });
      args[args.length - 1] = o;
      console.log("args", args);
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
      // -e 执行代码
      const child = spawn("node", ["-e", code], {
        // 当前命令执行的位置
        cwd: process.cwd(),
        stdio: "inherit",
      });
      child.on("error", (e) => {
        log.error(e.message);
        process.exit(1);
      });
      child.on("exit", (e) => {
        log.verbose("命令执行成功:" + e);
        process.exit(e);
      });
    } catch (e) {
      log.error(e.message);
    }
  }
}

module.exports = exec;
