// page.js

var mixinLayout = require("./mixinLayout");
var layout      = require("./layout");
var tabs        = require("./tabs");
var header      = require("./header");
var body        = require("./body");

var Page = function(config) {
  var title = config.title || "";
  var feed  = config.feed || null;
  var list  = config.list || [];
  return {
    controller: function() {},
    view: mixinLayout({
      layout : layout,
      tabs   : tabs,
      header : header({title: title}),
      body   : body({
        feed: feed,
        list: list
      })
    })
  };
};

module.exports = Page;
