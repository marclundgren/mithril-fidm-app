// back.js

var m = require('mithril');

m.route.previous = function() {
  var delimiter = '/';
  var previous;

  var route = m.route() || delimiter;
  if (route.length >= 1) {
    var arr = route.split(delimiter);

    arr.pop();

    previous = arr.join(delimiter);
  }
  else {
    previous = delimiter;
  }

  return previous;
};
m.route.back = function() {
  m.route(m.route.previous());
};

var config = {
  onclick: m.route.back,
  style: {
    cursor: 'pointer'
  }
};

module.exports = m('.back', [
  m('a', config, 'Back')
]);
