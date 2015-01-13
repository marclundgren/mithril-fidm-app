m = require('mithril');

var tab = function(config) {
  return m('a', {
      href: '/' + config.title.toLowerCase(),
      config: m.route
    },
    config.title
  );
};

var tabs = function() {
  return m('.tabs', [
    tab({title: 'News'  }),
    tab({title: 'Events'}),
    tab({title: 'About' })
  ]);
};

module.exports = tabs;
