// page.js

var mixinLayout = require("./mixinLayout");
var layout      = require("./layout");
var tabs        = require("./tabs");
var header      = require("./header");
var body        = require("./body");

var Page = function(config) {
  var title = config.title || "";
  var list  = config.list || [];
  return {
    controller: function() {},
    view: mixinLayout({
      layout : layout,
      header : header({title: title}),
      body   : body({list: list}),
      tabs   : tabs
    })
  };
};

module.exports = Page;
