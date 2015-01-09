// nav-item.js

module.exports = function(config) {


  var tabs = {
    controller : function(){},
    view       : function(){
      return m( '.page.page1', [
        m('h1', config.title ),
        m( 'a', {
          config : m.route,
          href : config.url
        }, 'Go to page 2' ),
              ' ',
        m( 'a', {
          config : m.route,
          href : '/route3'
        }, 'Go to page 3' )
      ] );
    }
  };
}
