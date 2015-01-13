var mixinLayout = function(config) {
  var layout = config.layout;
  var header = config.header;
  var body   = config.body;
  var tabs   = config.tabs;

  return function() {
    return layout(header(), body(), tabs());
  };
};

module.exports = mixinLayout;
