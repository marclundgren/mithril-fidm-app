/* jshint strict:false, undef:false */

m = require('mithril');

module.exports = {
  controller: function() {},
  view: function() {
    return [
      m('h1', 'Events'),
      m('ul', [
        m('li', 'list item 1'),
        m('li', 'list item 2'),
        m('li', 'list item 3')
      ])
    ];
  }
};
