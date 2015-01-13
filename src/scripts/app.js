// app.js

var m = require('mithril');

var routes = require('./routes');

m.route(document.getElementById('app'), routes.default, routes.map);
