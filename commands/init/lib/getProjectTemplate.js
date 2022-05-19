const request = require("@yq-cli-dev/request");

module.exports = function () {
  return request({
    url: "/project/template",
  });
};
