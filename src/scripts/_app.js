// app.js

/* jshint strict:false */

var m = require('mithril');
// var anim = require('./mithril-animate');
// var animator = require('./animator');

var tabs = require('./tabs');

var header = require('./header');

header.title('Root');
header.back('/');

// var Header = require('./header');

// var header = Header({
//   back: '/',
//   title: 'Hello'
// });

// m.module(document.getElementById('header'), header);

// header
console.log('header: ', header);

// console.log('tabs: ', tabs);

// m.module(document.getElementById('header'), header);
m.module(document.getElementById('tabs'), tabs);

m.route( document.getElementById('app'), '/news', {
  '/news'               : require('./tab-news'),
  '/news/blogs'         : require('./news-blogs'),
  '/news/blogs/fashion-club'   : require('./news-blogs-fashion-club'),
  '/news/blogs/fashion-museum' : require('./news-blogs-fashion-museum'),
  '/news/blogs/fashion-news'   : require('./news-blogs-fashion-news'),
  '/news/topics'        : require('./news-topics'),
  '/news/fashion-trends': require('./news-fashion-trends'),
  '/events'             : require('./tab-events'),
  '/about'              : require('./tab-about')
} );


// console.log('m: ', m);
// console.log('animator: ', animator);
// // console.log('anim: ', anim);

// // Our modules, simple for the sake of example.
// // The modules don't need any animator-specific code, nor are there any conditions that must be met.
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

// var page3 = {
//   controller : function(){},
//   view       : function(){
//     return m( '.page.page3', [
//       m('h1', 'Page 3!' ),
//       m( 'a', {
//         config : m.route,
//         href : '/route1'
//       }, 'Go to page 1' ),
//             ' ',
//       m( 'a', {
//         config : m.route,
//         href : '/route2'
//       }, 'Go to page 2' )
//     ] );
//   }
// };

// // A convenience wrapper to bind slideIn and slideOut functions (below) to a module using the animator plugin:
// // https://gist.github.com/barneycarroll/c69fbe0786e37c941baf
// var slidingPage = animator( slideIn, slideOut );

// // Pass slidingPage variations of each page into the route.
// m.route( document.body, '/route1', {
//   '/route1' : slidingPage( page1 ),
//   '/route2' : slidingPage( page2 ),
//   '/route3' : slidingPage( page3 )
// } );

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
