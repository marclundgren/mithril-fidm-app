// Header.js

var back = require('./back');

var header = function(config) {
  config = config || {};

  return function() {
    return [
      back,
      m('h1', config.title),
    ];
  };
};

module.exports = header;
