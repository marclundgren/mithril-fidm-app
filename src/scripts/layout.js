var layout = function(header, body, tabs) {
  return m(".layout", [
    m("header", header),
    m("main", body),
    m("nav", tabs)
  ]);
};

module.exports = layout;
