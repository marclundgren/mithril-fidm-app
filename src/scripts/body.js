// body.js

var Body = function(config) {
  config = config || {};

  return function() {
    var list = config.list || [];

    return m("ul.list", [
      list.map(function(item) {
        var itemConfig = {
          config: m.route,
          href: item.url
        };

        return m("li", [
          m("a", itemConfig, item.title)
        ]);
      })
    ]);
  };
};

module.exports = Body;
