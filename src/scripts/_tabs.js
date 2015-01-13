m = require('mithril');
// var anim = require('./mithril-animate');
// var animator = require('../animator');
// console.log('animator: ', animator);

console.log('m: ', m);
// console.log('animator: ', animator);
// console.log('anim: ', anim);


module.exports = {
  controller: function() {},
  view: function() {
    return m('div.tabs', [
      m('a', {
          href: '/news',
          config: m.route
        },
        'News'
      ),
      m('a', {
          href: '/events',
          config: m.route
        },
        'Events'
      ),
      m('a', {
          href: '/about',
          config: m.route
        },
        'About'
      )
    ]);
  }
};


// Our modules, simple for the sake of example.
// The modules don't need any animator-specific code, nor are there any conditions that must be met.

// var config = {
//   title: 'page1',
//   list : [],
//   url: 'page1'
// };

// var tabs = {
//   controller : function(){},
//   view       : function(){
//     return m( '.page.page1', [
//       // m('h1', config.title ),
//       m( 'a', {
//         config : m.route,
//         href : '/page1'
//       }, 'Go to page 1' ),
//       m( 'a', {
//         config : m.route,
//         href : '/page2'
//       }, 'Go to page 2' ),
//       m( 'a', {
//         config : m.route,
//         href : '/about-fidm'
//       }, 'About FIDM' )
//     ] );
//   }
// };

// m.module(document.getElementById('tabs'), tabs);

// var page1 = {
//   controller : function(){},
//   view       : function(){
//     return m( '.page.page1', [
//       m('h1', 'Page 1!' ),
//       m( 'a', {
//         config : m.route,
//         href : '/route2'
//       }, 'Go to page 2' ),
//             ' ',
//       m( 'a', {
//         config : m.route,
//         href : '/route3'
//       }, 'Go to page 3' )
//     ] );
//   }
// };

// var page2 = {
//   controller : function(){},
//   view       : function(){
//     return m( '.page.page2', [
//       m('h1', 'Page 2!' ),
//       m( 'a', {
//         config : m.route,
//         href : '/route1'
//       }, 'Go to page 1' ),
//             ' ',
//       m( 'a', {
//         config : m.route,
//         href : '/route3'
//       }, 'Go to page 3' )
//     ] );
//   }
// };

// // A convenience wrapper to bind slideIn and slideOut functions (below) to a module using the animator plugin:
// // https://gist.github.com/barneycarroll/c69fbe0786e37c941baf
// var slidingPage = animator( slideIn, slideOut );

// // Pass slidingPage variations of each page into the route.
// // m.route( document.getElementById('app'), '/route1', {
// //   '/route1' : slidingPage( page1 ),
// //   '/route2' : slidingPage( page2 ),
// //   '/about-fidm' : slidingPage( require('./about-fidm') )
// // } );

// // Animation for sliding in. This is a bit basic, but you could do anything.
// function slideIn( el, callback ){
//   el.style.left       = '-100%';
//   el.style.top        = '0';
//   el.style.position   = 'fixed';
//   el.style.transition = 'left .6s ease-in-out';

//   setTimeout( function transit(){
//     el.style.left = '0%';
//   } );

//   el.addEventListener( 'transitionend', callback, false );
// }

// // Slide out.
// function slideOut( el, callback ){
//   el.style.left       = '0%';
//   el.style.top        = '0';
//   el.style.position   = 'fixed';
//   el.style.transition = 'left .6s ease-in-out';

//   setTimeout( function transit(){
//     el.style.left = '100%';
//   } );

//     // Remember to fire the callback when the animation is finished.
//   el.addEventListener( 'transitionend', callback, false );
// }


// module.exports = {};
