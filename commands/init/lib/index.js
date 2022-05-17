"use strict";

const fs = require("fs");
const Command = require("@yq-cli-dev/command");
const log = require("@yq-cli-dev/log");

const inquirer = require("inquirer");
const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";

const TEMPLATE_TYPE_NORMAL = "normal";
const TEMPLATE_TYPE_CUSTOM = "custom";

const WHITE_COMMAND = ["npm", "cnpm"];

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._cmd.force;
    log.verbose("projectName", this.projectName);
    log.verbose("force", this.force);
  }

  async exec() {
    try {
      // 1. 准备阶段
      const projectInfo = await this.prepare();
      if (projectInfo) {
        // // 2. 下载模板
        // log.verbose("projectInfo", projectInfo);
        // this.projectInfo = projectInfo;
        // await this.downloadTemplate();
        // // 3. 安装模板
        // await this.installTemplate();
      }
    } catch (e) {
      log.error(e.message);
      if (process.env.LOG_LEVEL === "verbose") {
        console.log(e);
      }
    }
  }

  async prepare() {
    // 0. 判断项目模板是否存在
    // const template = await getProjectTemplate();
    // if (!template || template.length === 0) {
    //   throw new Error("项目模板不存在");
    // }
    // this.template = template;
    // 1. 判断当前目录是否为空
    const localPath = process.cwd();
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false;
      if (!this.force) {
        // 询问是否继续创建
        ifContinue = (
          await inquirer.prompt({
            type: "confirm",
            name: "ifContinue",
            default: false,
            message: "当前文件夹不为空，是否继续创建项目？",
          })
        ).ifContinue;
        if (!ifContinue) {
          return;
        }
      }
      // 2. 是否启动强制更新
      if (ifContinue || this.force) {
        // 给用户做二次确认
        const { confirmDelete } = await inquirer.prompt({
          type: "confirm",
          name: "confirmDelete",
          default: false,
          message: "是否确认清空当前目录下的文件？",
        });
        if (confirmDelete) {
          // 清空当前目录
          fse.emptyDirSync(localPath);
        }
      }
    }
    // return this.getProjectInfo();
  }

  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath);
    console.log("fileList", fileList);
    // 文件过滤的逻辑
    fileList = fileList.filter(
      (file) => !file.startsWith(".") && ["node_modules"].indexOf(file) < 0
    );
    return !fileList || fileList.length <= 0;
  }
}

function init(argv) {
  // console.log("init", projectName, cmdObj);
  return new InitCommand(argv);
}

module.exports.InitCommand = InitCommand;

module.exports = init;
