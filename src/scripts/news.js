var Page = require('./page');

module.exports = Page({
  list: [
    { title: 'Blogs',       url: '/news/blogs' },
    { title: 'Topics',      url: '/news/topics' },
    { title: 'Trends',      url: '/news/trends' }
  ],
  title: 'News'
});
