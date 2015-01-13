// app.js

module.exports = {
  default: '/news',
  map: {
    '/news'                                                                 : require('./news'),
    '/news/blogs'                                                           : require('./news-blogs'),
    '/news/blogs/fidm-news'                                                 : require('./news-fidm-news'),
    '/news/blogs/fidm-museum'                                               : require('./news-fidm-museum'),
    '/news/blogs/fidm-digital-arts'                                         : require('./news-fidm-digital-arts'),
    '/news/blogs/fashion-club'                                              : require('./news-fashion-club'),
    '/news/topics'                                                          : require('./news-topics'),
    '/news/topics/alumni'                                                   : require('./news-by-topic-alumni'),
    '/news/topics/careers'                                                  : require('./news-by-topic-careers'),
    '/news/topics/fidm-students'                                            : require('./news-by-topic-fidm-students'),
    '/news/topics/apparel-industry-management'                              : require('./news-by-topic-apparel-industry-management'),
    '/news/topics/beauty-industry-merchandising-and-management'             : require('./news-by-topic-beauty-industry-merchandising-and-management'),
    '/news/topics/business-management'                                      : require('./news-by-topic-business-management'),
    '/news/topics/digital-media'                                            : require('./news-by-topic-digital-media'),
    '/news/topics/entertainment-set-design-and-decoration'                  : require('./news-by-topic-entertainment-set-design-and-decoration'),
    '/news/topics/fashion-design'                                           : require('./news-by-topic-fashion-design'),
    '/news/topics/fashion-knitwear-design'                                  : require('./news-by-topic-fashion-knitwear-design'),
    '/news/topics/film-and-tv-costume-design'                               : require('./news-by-topic-film-and-tv-costume-design'),
    '/news/topics/footwear-design'                                          : require('./news-by-topic-footwear-design'),
    '/news/topics/graphic-design'                                           : require('./news-by-topic-graphic-design'),
    '/news/topics/interior-design'                                          : require('./news-by-topic-interior-design'),
    '/news/topics/international-manufacturing-and-product-development'      : require('./news-by-topic-international-manufacturing-and-product-development'),
    '/news/topics/jewelry-design'                                           : require('./news-by-topic-jewelry-design'),
    '/news/topics/merchandise-marketing'                                    : require('./news-by-topic-merchandise-marketing'),
    '/news/topics/merchandise-product-development'                          : require('./news-by-topic-merchandise-product-development'),
    '/news/topics/textile-design'                                           : require('./news-by-topic-textile-design'),
    '/news/topics/theatre-costume-design'                                   : require('./news-by-topic-theatre-costume-design'),
    '/news/topics/visual-communications'                                    : require('./news-by-topic-visual-communications'),
    '/news/trends'                                                          : require('./news-trends'),
    '/about'                                                                : require('./about'),
    '/about/about-fidm'                                                     : require('./about-about-fidm'),
    '/about/digital-arts'                                                   : require('./about-digital-arts'),
    '/about/facebook'                                                       : require('./about-facebook'),
    '/about/fashionclub'                                                    : require('./about-fashionclub'),
    '/about/fidm.edu'                                                       : require('./about-fidm.edu'),
    '/about/college-info'                                                   : require('./about-request-college-info'),
    '/about/contact-us'                                                     : require('./about-request-contact-us'),
    '/about/fidm-majors'                                                    : require('./about-request-fidm-majors'),
    '/about/request-photo-tour'                                             : require('./about-request-photo-tour'),
    '/about/request-photo-tour/los-angeles-campus'                          : require('./about-request-photo-tour-los-angeles-campus'),
    '/about/request-photo-tour/los-angeles-campus/contact-sheet'            : require('./about-request-photo-tour-los-angeles-campus-contact-sheet'),
    '/about/request-photo-tour/los-angeles-campus/contact-sheet/slideshow'  : require('./about-request-photo-tour-los-angeles-campus-contact-sheet-slideshow'),
    '/about/request-photo-tour/san-diego-campus'                            : require('./about-request-photo-tour-san-diego-campus'),
    '/about/request-photo-tour/san-diego-campus/contact-sheet'              : require('./about-request-photo-tour-san-diego-campus-contact-sheet'),
    '/about/request-photo-tour/san-diego-campus/contact-sheet/slideshow'    : require('./about-request-photo-tour-san-diego-campus-contact-sheet-slideshow'),
    '/about/request-photo-tour/san-francisco-campus'                        : require('./about-request-photo-tour-san-francisco-campus'),
    '/about/request-photo-tour/san-francisco-campus/contact-sheet'          : require('./about-request-photo-tour-san-francisco-campus-contact-sheet'),
    '/about/request-photo-tour/san-francisco-campus/contact-sheet/slideshow': require('./about-request-photo-tour-san-francisco-campus-contact-sheet-slideshow'),
    '/about/twitter'                                                        : require('./about-twitter'),
    '/events'                                                               : require('./events')
  }
};




