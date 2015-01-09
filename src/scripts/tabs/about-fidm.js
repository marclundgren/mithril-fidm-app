/* jshint strict:false */

var m = require('../mithril-animate');
// var anim = require('./mithril-animate');
var animator = require('../animator');

module.exports = {
  controller : function(){},
  view       : function(){
    return m( '.page.about-fidm', [
      m('h1', 'About FIDM!' ),
      m( 'a', {
        config : m.route,
        href : '/route1'
      }, 'Go to page 1' ),
      m( 'a', {
        config : m.route,
        href : '/route2'
      }, 'Go to page 2' )
    ] );
  }
};
