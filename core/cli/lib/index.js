"use strict";

module.exports = core;

const path = require("path");
const semver = require("semver");
const colors = require("colors/safe");
const userHome = require("user-home");
const pathExists = require("path-exists").sync;
const commander = require("commander");
const constant = require("./const");
const pkg = require("../package.json");
const log = require("@yq-cli-dev/log");
const init = require("@yq-cli-dev/init");
const exec = require("@yq-cli-dev/exec");

let args, config;

const program = new commander.Command();

async function core() {
  try {
    await await prepare();
    // chheckNodeVersion();
    registerCommand();
  } catch (err) {
    log.error(err.message);
    if (program.debug) {
      console.log(e);
    }
  }
}

async function prepare() {
  checkPkgVersion();
  checkRoot();
  // checkInputArgs();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
}

// 注册命令
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", false)
    .option("-tp, --targetPath <targetPath>", "是否指定本地调试文件路径", "");

  program
    .command("init [projectName]")
    .option("-f, --force", "是否强制初始化项目")
    .action(exec);

  // program
  //   .command("publish")
  //   .option("--refreshServer", "强制更新远程Git仓库")
  //   .option("--refreshToken", "强制更新远程仓库token")
  //   .option("--refreshOwner", "强制更新远程仓库类型")
  //   .action(exec);

  // 开启debug模式
  program.on("option:debug", function () {
    if (program.debug) {
      process.env.LOG_LEVEL = "verbose";
    } else {
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL;
  });

  // 指定targetPath
  program.on("option:targetPath", function () {
    process.env.CLI_TARGET_PATH = program.targetPath;
  });

  // 对未知命令监听
  program.on("command:*", function (obj) {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    console.log(colors.red("未知的命令：" + obj[0]));
    if (availableCommands.length > 0) {
      console.log(colors.red("可用命令：" + availableCommands.join(",")));
    }
  });

  program.parse(process.argv);

  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

// 检查更新
async function checkGlobalUpdate() {
  // 1. 获取当前版本号和模块名
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  // 2. 调用npm API, 获取所有版本号和模块名
  // 3. 提取所有版本号，比对那些版本号是大于当前版本号
  // 4. 获取最新的版本号，提示用户更新到该版本号
  const { getNpmSemverVersion } = require("@yq-cli-dev/get-npm-info");
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion}
                更新命令： npm install -g ${npmName}`)
    );
  }
}

// 检查是否为root用户，如果是则会降级为普通用户启动
function checkRoot() {
  // 当前启动账户
  // console.log(process.geteuid());
  // 检查是否为root用户，如果是则会降级为普通用户启动
  const rootCheck = require("root-check");
  rootCheck();
  console.log(process.geteuid());
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在！"));
  }
}

// function chheckNodeVersion() {
//   // 第一步： 获取当前Node版本号
//   const currentersion = process.version;
//   const lowestVersion = constant.LOWEST_NODE_VERSION;
//   log.info("node version", currentersion);
//   // 第二步： 对比最低版本号
//   if (!semver.gte(currentersion, lowestVersion)) {
//     throw new Error(
//       colors.red(`yq-cli-dev 需要安装 v${lowestVersion} 以上版本的 Node.js`)
//     );
//   }
// }

// 检验当前版本
function checkPkgVersion() {
  log.info("cli", pkg.version);
}

// 检查输入参数
function checkInputArgs() {
  const minimist = require("minimist");
  args = minimist(process.argv.slice(2));
  checkArgs();
}

// 检验是否为debug模式
function checkArgs() {
  if (args.debug) {
    process.env.LOG_LEVEL = "verbose";
  } else {
    process.env.LOG_LEVEL = "info";
  }
  log.level = process.env.LOG_LEVEL;
}

function checkEnv() {
  const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHome, ".env");
  console.log("dotenvPath", dotenvPath);
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultConfig();
  log.verbose("环境变量", process.env.CLI_HOME_PATH);
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}
