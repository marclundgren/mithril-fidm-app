// body.js

var Body = function(config) {
  config = config || {};

  var list = function() {
    return m('ul.list', [
      (config.list || []).map(function(item) {
        var itemConfig = {
          config: m.route,
          href: item.url
        };

        return m('li', [
          m('a', itemConfig, item.title)
        ]);
      })
    ]);
  };

  var feed = function () {
    return m('iframe', {
      src: config.feed
    });
  };

  // Feed and List should be mutually exclusive
  if (config.feed) {
    return feed;
  }
  else {
    return list;
  }
};

module.exports = Body;
