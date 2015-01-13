// app.js

module.exports = {
  default: '/news',
  map: {
    '/news'                           : require('./news'),
    '/news/blogs'                     : require('./news-blogs'),
    '/news/blogs/fidm-news'           : require('./news-fidm-news'),
    '/news/blogs/fidm-museum'         : require('./news-fidm-museum'),
    '/news/blogs/fidm-digital-arts'   : require('./news-fidm-digital-arts'),
    '/news/blogs/fashion-club'        : require('./news-fashion-club'),
    '/news/topics'                    : require('./news-topics'),
    '/about'                          : require('./about'),
    '/events'                         : require('./events')
  }
};
