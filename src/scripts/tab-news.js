/* jshint strict:false, undef:false */

m = require('mithril');

var header = require('./header');

// header.title('News');
// header.back(null);
// m.module(document.getElementById('header'), header);

module.exports = {
  controller: function() {

  },
  view: function() {
    return [
      m('ul', [
        m('li', [
          m('a', {
            href: '/news/blogs',
            config: m.route
          }, 'News Blogs')
        ]),
        m('li', 'list item 2'),
        m('li', 'list item 3')
      ])
    ];
  }
};
