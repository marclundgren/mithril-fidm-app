(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./src/scripts/app.js":[function(require,module,exports){
// app.js

var m = require('mithril');

var routes = require('./routes');

m.route(document.getElementById('app'), routes.default, routes.map);

},{"./routes":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/routes.js","mithril":"/Users/marc/Dev/FIDM/mithril-fidm-app/node_modules/mithril/mithril.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/node_modules/mithril/mithril.js":[function(require,module,exports){
console.log('my mithril!');


var m = (function app(window, undefined) {
  var OBJECT = "[object Object]", ARRAY = "[object Array]", STRING = "[object String]", FUNCTION = "function";
  var type = {}.toString;
  var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g, attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;
  var voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/;

  // caching commonly used variables
  var $document, $location, $requestAnimationFrame, $cancelAnimationFrame;

  // self invoking function needed because of the way mocks work
  function initialize(window){
    $document = window.document;
    $location = window.location;
    $cancelAnimationFrame = window.cancelAnimationFrame || window.clearTimeout;
    $requestAnimationFrame = window.requestAnimationFrame || window.setTimeout;
  }

  initialize(window);


  /*
   * @typedef {String} Tag
   * A string that looks like -> div.classname#id[param=one][param2=two]
   * Which describes a DOM node
   */

  /*
   *
   * @param {Tag} The DOM node tag
   * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
   * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array, or splat (optional)
   *
   */
  function m() {
    var args = [].slice.call(arguments);
    var hasAttrs = args[1] != null && type.call(args[1]) === OBJECT && !("tag" in args[1]) && !("subtree" in args[1]);
    var attrs = hasAttrs ? args[1] : {};
    var classAttrName = "class" in attrs ? "class" : "className";
    var cell = {tag: "div", attrs: {}};
    var match, classes = [];
    if (type.call(args[0]) != STRING) throw new Error("selector in m(selector, attrs, children) should be a string")
    while (match = parser.exec(args[0])) {
      if (match[1] === "" && match[2]) cell.tag = match[2];
      else if (match[1] === "#") cell.attrs.id = match[2];
      else if (match[1] === ".") classes.push(match[2]);
      else if (match[3][0] === "[") {
        var pair = attrParser.exec(match[3]);
        cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" :true)
      }
    }
    if (classes.length > 0) cell.attrs[classAttrName] = classes.join(" ");


    var children = hasAttrs ? args[2] : args[1];
    if (type.call(children) === ARRAY) {
      cell.children = children
    }
    else {
      cell.children = hasAttrs ? args.slice(2) : args.slice(1)
    }

    for (var attrName in attrs) {
      if (attrName === classAttrName) cell.attrs[attrName] = (cell.attrs[attrName] || "") + " " + attrs[attrName];
      else cell.attrs[attrName] = attrs[attrName]
    }
    return cell
  }
  function build(parentElement, parentTag, parentCache, parentIndex, data, cached, shouldReattach, index, editable, namespace, configs) {
    //`build` is a recursive function that manages creation/diffing/removal of DOM elements based on comparison between `data` and `cached`
    //the diff algorithm can be summarized as this:
    //1 - compare `data` and `cached`
    //2 - if they are different, copy `data` to `cached` and update the DOM based on what the difference is
    //3 - recursively apply this algorithm for every array and for the children of every virtual element

    //the `cached` data structure is essentially the same as the previous redraw's `data` data structure, with a few additions:
    //- `cached` always has a property called `nodes`, which is a list of DOM elements that correspond to the data represented by the respective virtual element
    //- in order to support attaching `nodes` as a property of `cached`, `cached` is *always* a non-primitive object, i.e. if the data was a string, then cached is a String instance. If data was `null` or `undefined`, cached is `new String("")`
    //- `cached also has a `configContext` property, which is the state storage object exposed by config(element, isInitialized, context)
    //- when `cached` is an Object, it represents a virtual element; when it's an Array, it represents a list of elements; when it's a String, Number or Boolean, it represents a text node

    //`parentElement` is a DOM element used for W3C DOM API calls
    //`parentTag` is only used for handling a corner case for textarea values
    //`parentCache` is used to remove nodes in some multi-node cases
    //`parentIndex` and `index` are used to figure out the offset of nodes. They're artifacts from before arrays started being flattened and are likely refactorable
    //`data` and `cached` are, respectively, the new and old nodes being diffed
    //`shouldReattach` is a flag indicating whether a parent node was recreated (if so, and if this node is reused, then this node must reattach itself to the new parent)
    //`editable` is a flag that indicates whether an ancestor is contenteditable
    //`namespace` indicates the closest HTML namespace as it cascades down from an ancestor
    //`configs` is a list of config functions to run after the topmost `build` call finishes running

    //there's logic that relies on the assumption that null and undefined data are equivalent to empty strings
    //- this prevents lifecycle surprises from procedural helpers that mix implicit and explicit return statements (e.g. function foo() {if (cond) return m("div")}
    //- it simplifies diffing code
    //data.toString() is null if data is the return value of Console.log in Firefox
    if (data == null || data.toString() == null) data = "";
    if (data.subtree === "retain") return cached;
    var cachedType = type.call(cached), dataType = type.call(data);
    if (cached == null || cachedType !== dataType) {
      if (cached != null) {
        if (parentCache && parentCache.nodes) {
          var offset = index - parentIndex;
          var end = offset + (dataType === ARRAY ? data : cached.nodes).length;
          clear(parentCache.nodes.slice(offset, end), parentCache.slice(offset, end))
        }
        else if (cached.nodes) clear(cached.nodes, cached)
      }
      cached = new data.constructor;
      if (cached.tag) cached = {}; //if constructor creates a virtual dom element, use a blank object as the base cached node instead of copying the virtual el (#277)
      cached.nodes = []
    }

    if (dataType === ARRAY) {
      //recursively flatten array
      for (var i = 0, len = data.length; i < len; i++) {
        if (type.call(data[i]) === ARRAY) {
          data = data.concat.apply([], data);
          i-- //check current index again and flatten until there are no more nested arrays at that index
        }
      }

      var nodes = [], intact = cached.length === data.length, subArrayCount = 0;

      //keys algorithm: sort elements without recreating them if keys are present
      //1) create a map of all existing keys, and mark all for deletion
      //2) add new keys to map and mark them for addition
      //3) if key exists in new list, change action from deletion to a move
      //4) for each key, handle its corresponding action as marked in previous steps
      //5) copy unkeyed items into their respective gaps
      var DELETION = 1, INSERTION = 2 , MOVE = 3;
      var existing = {}, unkeyed = [], shouldMaintainIdentities = false;
      for (var i = 0; i < cached.length; i++) {
        if (cached[i] && cached[i].attrs && cached[i].attrs.key != null) {
          shouldMaintainIdentities = true;
          existing[cached[i].attrs.key] = {action: DELETION, index: i}
        }
      }
      if (shouldMaintainIdentities) {
        if (data.indexOf(null) > -1) data = data.filter(function(x) {return x != null})

        var keysDiffer = false
        if (data.length != cached.length) keysDiffer = true
        else for (var i = 0, cachedCell, dataCell; cachedCell = cached[i], dataCell = data[i]; i++) {
          if (cachedCell.attrs && dataCell.attrs && cachedCell.attrs.key != dataCell.attrs.key) {
            keysDiffer = true
            break
          }
        }

        if (keysDiffer) {
          for (var i = 0, len = data.length; i < len; i++) {
            if (data[i] && data[i].attrs) {
              if (data[i].attrs.key != null) {
                var key = data[i].attrs.key;
                if (!existing[key]) existing[key] = {action: INSERTION, index: i};
                else existing[key] = {
                  action: MOVE,
                  index: i,
                  from: existing[key].index,
                  element: parentElement.childNodes[existing[key].index] || $document.createElement("div")
                }
              }
              else unkeyed.push({index: i, element: parentElement.childNodes[i] || $document.createElement("div")})
            }
          }
          var actions = []
          for (var prop in existing) actions.push(existing[prop])
          var changes = actions.sort(sortChanges);
          var newCached = new Array(cached.length)

          for (var i = 0, change; change = changes[i]; i++) {
            if (change.action === DELETION) {
              clear(cached[change.index].nodes, cached[change.index]);
              newCached.splice(change.index, 1)
            }
            if (change.action === INSERTION) {
              var dummy = $document.createElement("div");
              dummy.key = data[change.index].attrs.key;
              parentElement.insertBefore(dummy, parentElement.childNodes[change.index] || null);
              newCached.splice(change.index, 0, {attrs: {key: data[change.index].attrs.key}, nodes: [dummy]})
            }

            if (change.action === MOVE) {
              if (parentElement.childNodes[change.index] !== change.element && change.element !== null) {
                parentElement.insertBefore(change.element, parentElement.childNodes[change.index] || null)
              }
              newCached[change.index] = cached[change.from]
            }
          }
          for (var i = 0, len = unkeyed.length; i < len; i++) {
            var change = unkeyed[i];
            parentElement.insertBefore(change.element, parentElement.childNodes[change.index] || null);
            newCached[change.index] = cached[change.index]
          }
          cached = newCached;
          cached.nodes = new Array(parentElement.childNodes.length);
          for (var i = 0, child; child = parentElement.childNodes[i]; i++) cached.nodes[i] = child
        }
      }
      //end key algorithm

      for (var i = 0, cacheCount = 0, len = data.length; i < len; i++) {
        //diff each item in the array
        var item = build(parentElement, parentTag, cached, index, data[i], cached[cacheCount], shouldReattach, index + subArrayCount || subArrayCount, editable, namespace, configs);
        if (item === undefined) continue;
        if (!item.nodes.intact) intact = false;
        if (item.$trusted) {
          //fix offset of next element if item was a trusted string w/ more than one html element
          //the first clause in the regexp matches elements
          //the second clause (after the pipe) matches text nodes
          subArrayCount += (item.match(/<[^\/]|\>\s*[^<]/g) || []).length
        }
        else subArrayCount += type.call(item) === ARRAY ? item.length : 1;
        cached[cacheCount++] = item
      }
      if (!intact) {
        //diff the array itself

        //update the list of DOM nodes by collecting the nodes from each item
        for (var i = 0, len = data.length; i < len; i++) {
          if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes)
        }
        //remove items from the end of the array if the new array is shorter than the old one
        //if errors ever happen here, the issue is most likely a bug in the construction of the `cached` data structure somewhere earlier in the program
        for (var i = 0, node; node = cached.nodes[i]; i++) {
          if (node.parentNode != null && nodes.indexOf(node) < 0) clear([node], [cached[i]])
        }
        if (data.length < cached.length) cached.length = data.length;
        cached.nodes = nodes
      }
    }
    else if (data != null && dataType === OBJECT) {
      if (!data.attrs) data.attrs = {};
      if (!cached.attrs) cached.attrs = {};

      var dataAttrKeys = Object.keys(data.attrs)
      var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0)
      //if an element is different enough from the one in cache, recreate it
      if (data.tag != cached.tag || dataAttrKeys.join() != Object.keys(cached.attrs).join() || data.attrs.id != cached.attrs.id) {
        if (cached.nodes.length) clear(cached.nodes);
        if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) cached.configContext.onunload()
      }
      if (type.call(data.tag) != STRING) return;

      var node, isNew = cached.nodes.length === 0;
      if (data.attrs.xmlns) namespace = data.attrs.xmlns;
      else if (data.tag === "svg") namespace = "http://www.w3.org/2000/svg";
      else if (data.tag === "math") namespace = "http://www.w3.org/1998/Math/MathML";
      if (isNew) {
        if (data.attrs.is) node = namespace === undefined ? $document.createElement(data.tag, data.attrs.is) : $document.createElementNS(namespace, data.tag, data.attrs.is);
        else node = namespace === undefined ? $document.createElement(data.tag) : $document.createElementNS(namespace, data.tag);
        cached = {
          tag: data.tag,
          //set attributes first, then create children
          attrs: hasKeys ? setAttributes(node, data.tag, data.attrs, {}, namespace) : data.attrs,
          children: data.children != null && data.children.length > 0 ?
            build(node, data.tag, undefined, undefined, data.children, cached.children, true, 0, data.attrs.contenteditable ? node : editable, namespace, configs) :
            data.children,
          nodes: [node]
        };
        if (cached.children && !cached.children.nodes) cached.children.nodes = [];
        //edge case: setting value on <select> doesn't work before children exist, so set it again after children have been created
        if (data.tag === "select" && data.attrs.value) setAttributes(node, data.tag, {value: data.attrs.value}, {}, namespace);
        parentElement.insertBefore(node, parentElement.childNodes[index] || null)
      }
      else {
        node = cached.nodes[0];
        if (hasKeys) setAttributes(node, data.tag, data.attrs, cached.attrs, namespace);
        cached.children = build(node, data.tag, undefined, undefined, data.children, cached.children, false, 0, data.attrs.contenteditable ? node : editable, namespace, configs);
        cached.nodes.intact = true;
        if (shouldReattach === true && node != null) parentElement.insertBefore(node, parentElement.childNodes[index] || null)
      }
      //schedule configs to be called. They are called after `build` finishes running
      if (typeof data.attrs["config"] === FUNCTION) {
        var context = cached.configContext = cached.configContext || {};

        // bind
        var callback = function(data, args) {
          return function() {
            return data.attrs["config"].apply(data, args)
          }
        };
        configs.push(callback(data, [node, !isNew, context, cached]))
      }
    }
    else if (typeof dataType != FUNCTION) {
      //handle text nodes
      var nodes;
      if (cached.nodes.length === 0) {
        if (data.$trusted) {
          nodes = injectHTML(parentElement, index, data)
        }
        else {
          nodes = [$document.createTextNode(data)];
          if (!parentElement.nodeName.match(voidElements)) parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null)
        }
        cached = "string number boolean".indexOf(typeof data) > -1 ? new data.constructor(data) : data;
        cached.nodes = nodes
      }
      else if (cached.valueOf() !== data.valueOf() || shouldReattach === true) {
        nodes = cached.nodes;
        if (!editable || editable !== $document.activeElement) {
          if (data.$trusted) {
            clear(nodes, cached);
            nodes = injectHTML(parentElement, index, data)
          }
          else {
            //corner case: replacing the nodeValue of a text node that is a child of a textarea/contenteditable doesn't work
            //we need to update the value property of the parent textarea or the innerHTML of the contenteditable element instead
            if (parentTag === "textarea") parentElement.value = data;
            else if (editable) editable.innerHTML = data;
            else {
              if (nodes[0].nodeType === 1 || nodes.length > 1) { //was a trusted string
                clear(cached.nodes, cached);
                nodes = [$document.createTextNode(data)]
              }
              parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null);
              nodes[0].nodeValue = data
            }
          }
        }
        cached = new data.constructor(data);
        cached.nodes = nodes
      }
      else cached.nodes.intact = true
    }

    return cached
  }
  function sortChanges(a, b) {return a.action - b.action || a.index - b.index}
  function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
    for (var attrName in dataAttrs) {
      var dataAttr = dataAttrs[attrName];
      var cachedAttr = cachedAttrs[attrName];
      if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr)) {
        cachedAttrs[attrName] = dataAttr;
        try {
          //`config` isn't a real attributes, so ignore it
          if (attrName === "config" || attrName == "key") continue;
          //hook event handlers to the auto-redrawing system
          else if (typeof dataAttr === FUNCTION && attrName.indexOf("on") === 0) {
            node[attrName] = autoredraw(dataAttr, node)
          }
          //handle `style: {...}`
          else if (attrName === "style" && dataAttr != null && type.call(dataAttr) === OBJECT) {
            for (var rule in dataAttr) {
              if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) node.style[rule] = dataAttr[rule]
            }
            for (var rule in cachedAttr) {
              if (!(rule in dataAttr)) node.style[rule] = ""
            }
          }
          //handle SVG
          else if (namespace != null) {
            if (attrName === "href") node.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataAttr);
            else if (attrName === "className") node.setAttribute("class", dataAttr);
            else node.setAttribute(attrName, dataAttr)
          }
          //handle cases that are properties (but ignore cases where we should use setAttribute instead)
          //- list and form are typically used as strings, but are DOM element references in js
          //- when using CSS selectors (e.g. `m("[style='']")`), style is used as a string, but it's an object in js
          else if (attrName in node && !(attrName === "list" || attrName === "style" || attrName === "form" || attrName === "type")) {
            //#348 don't set the value if not needed otherwise cursor placement breaks in Chrome
            if (tag !== "input" || node[attrName] !== dataAttr) node[attrName] = dataAttr
          }
          else node.setAttribute(attrName, dataAttr)
        }
        catch (e) {
          //swallow IE's invalid argument errors to mimic HTML's fallback-to-doing-nothing-on-invalid-attributes behavior
          if (e.message.indexOf("Invalid argument") < 0) throw e
        }
      }
      //#348 dataAttr may not be a string, so use loose comparison (double equal) instead of strict (triple equal)
      else if (attrName === "value" && tag === "input" && node.value != dataAttr) {
        node.value = dataAttr
      }
    }
    return cachedAttrs
  }
  function clear(nodes, cached) {
    for (var i = nodes.length - 1; i > -1; i--) {
      if (nodes[i] && nodes[i].parentNode) {
        try {nodes[i].parentNode.removeChild(nodes[i])}
        catch (e) {} //ignore if this fails due to order of events (see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
        cached = [].concat(cached);
        if (cached[i]) unload(cached[i])
      }
    }
    if (nodes.length != 0) nodes.length = 0
  }
  function unload(cached) {
    if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) cached.configContext.onunload();
    if (cached.children) {
      if (type.call(cached.children) === ARRAY) {
        for (var i = 0, child; child = cached.children[i]; i++) unload(child)
      }
      else if (cached.children.tag) unload(cached.children)
    }
  }
  function injectHTML(parentElement, index, data) {
    var nextSibling = parentElement.childNodes[index];
    if (nextSibling) {
      var isElement = nextSibling.nodeType != 1;
      var placeholder = $document.createElement("span");
      if (isElement) {
        parentElement.insertBefore(placeholder, nextSibling || null);
        placeholder.insertAdjacentHTML("beforebegin", data);
        parentElement.removeChild(placeholder)
      }
      else nextSibling.insertAdjacentHTML("beforebegin", data)
    }
    else parentElement.insertAdjacentHTML("beforeend", data);
    var nodes = [];
    while (parentElement.childNodes[index] !== nextSibling) {
      nodes.push(parentElement.childNodes[index]);
      index++
    }
    return nodes
  }
  function autoredraw(callback, object) {
    return function(e) {
      e = e || event;
      m.redraw.strategy("diff");
      m.startComputation();
      try {return callback.call(object, e)}
      finally {
        endFirstComputation()
      }
    }
  }

  var html;
  var documentNode = {
    appendChild: function(node) {
      if (html === undefined) html = $document.createElement("html");
      if ($document.documentElement && $document.documentElement !== node) {
        $document.replaceChild(node, $document.documentElement)
      }
      else $document.appendChild(node);
      this.childNodes = $document.childNodes
    },
    insertBefore: function(node) {
      this.appendChild(node)
    },
    childNodes: []
  };
  var nodeCache = [], cellCache = {};
  m.render = function(root, cell, forceRecreation) {
    var configs = [];
    if (!root) throw new Error("Please ensure the DOM element exists before rendering a template into it.");
    var id = getCellCacheKey(root);
    var isDocumentRoot = root === $document;
    var node = isDocumentRoot || root === $document.documentElement ? documentNode : root;
    if (isDocumentRoot && cell.tag != "html") cell = {tag: "html", attrs: {}, children: cell};
    if (cellCache[id] === undefined) clear(node.childNodes);
    if (forceRecreation === true) reset(root);
    cellCache[id] = build(node, null, undefined, undefined, cell, cellCache[id], false, 0, null, undefined, configs);
    for (var i = 0, len = configs.length; i < len; i++) configs[i]()
  };
  function getCellCacheKey(element) {
    var index = nodeCache.indexOf(element);
    return index < 0 ? nodeCache.push(element) - 1 : index
  }

  m.trust = function(value) {
    value = new String(value);
    value.$trusted = true;
    return value
  };

  function gettersetter(store) {
    var prop = function() {
      if (arguments.length) store = arguments[0];
      return store
    };

    prop.toJSON = function() {
      return store
    };

    return prop
  }

  m.prop = function (store) {
    //note: using non-strict equality check here because we're checking if store is null OR undefined
    if (((store != null && type.call(store) === OBJECT) || typeof store === FUNCTION) && typeof store.then === FUNCTION) {
      return propify(store)
    }

    return gettersetter(store)
  };

  var roots = [], modules = [], controllers = [], lastRedrawId = null, lastRedrawCallTime = 0, computePostRedrawHook = null, prevented = false, topModule;
  var FRAME_BUDGET = 16; //60 frames per second = 1 call per 16 ms
  m.module = function(root, module) {
    if (!root) throw new Error("Please ensure the DOM element exists before rendering a template into it.");
    var index = roots.indexOf(root);
    if (index < 0) index = roots.length;
    var isPrevented = false;
    if (controllers[index] && typeof controllers[index].onunload === FUNCTION) {
      var event = {
        preventDefault: function() {isPrevented = true}
      };
      controllers[index].onunload(event)
    }
    if (!isPrevented) {
      m.redraw.strategy("all");
      m.startComputation();
      roots[index] = root;
      var currentModule = topModule = module;
      var controller = new module.controller;
      //controllers may call m.module recursively (via m.route redirects, for example)
      //this conditional ensures only the last recursive m.module call is applied
      if (currentModule === topModule) {
        controllers[index] = controller;
        modules[index] = module
      }
      endFirstComputation();
      return controllers[index]
    }
  };
  m.redraw = function(force) {
    //lastRedrawId is a positive number if a second redraw is requested before the next animation frame
    //lastRedrawID is null if it's the first redraw and not an event handler
    if (lastRedrawId && force !== true) {
      //when setTimeout: only reschedule redraw if time between now and previous redraw is bigger than a frame, otherwise keep currently scheduled timeout
      //when rAF: always reschedule redraw
      if (new Date - lastRedrawCallTime > FRAME_BUDGET || $requestAnimationFrame === window.requestAnimationFrame) {
        if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId);
        lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
      }
    }
    else {
      redraw();
      lastRedrawId = $requestAnimationFrame(function() {lastRedrawId = null}, FRAME_BUDGET)
    }
  };
  m.redraw.strategy = m.prop();
  function redraw() {
    var forceRedraw = m.redraw.strategy() === "all";
    for (var i = 0, root; root = roots[i]; i++) {
      if (controllers[i]) {
        m.render(root, modules[i].view(controllers[i]), forceRedraw)
      }
    }
    //after rendering within a routed context, we need to scroll back to the top, and fetch the document title for history.pushState
    if (computePostRedrawHook) {
      computePostRedrawHook();
      computePostRedrawHook = null
    }
    lastRedrawId = null;
    lastRedrawCallTime = new Date;
    m.redraw.strategy("diff")
  }

  var pendingRequests = 0;
  m.startComputation = function() {pendingRequests++};
  m.endComputation = function() {
    pendingRequests = Math.max(pendingRequests - 1, 0);
    if (pendingRequests === 0) m.redraw()
  };
  var endFirstComputation = function() {
    if (m.redraw.strategy() == "none") {
      pendingRequests--
      m.redraw.strategy("diff")
    }
    else m.endComputation();
  }

  m.withAttr = function(prop, withAttrCallback) {
    return function(e) {
      e = e || event;
      var currentTarget = e.currentTarget || this;
      withAttrCallback(prop in currentTarget ? currentTarget[prop] : currentTarget.getAttribute(prop))
    }
  };

  //routing
  var modes = {pathname: "", hash: "#", search: "?"};
  var redirect = function() {}, routeParams, currentRoute;
  m.route = function() {
    //m.route()
    if (arguments.length === 0) return currentRoute;
    //m.route(el, defaultRoute, routes)
    else if (arguments.length === 3 && type.call(arguments[1]) === STRING) {
      var root = arguments[0], defaultRoute = arguments[1], router = arguments[2];
      redirect = function(source) {
        var path = currentRoute = normalizeRoute(source);
        if (!routeByValue(root, router, path)) {
          m.route(defaultRoute, true)
        }
      };
      var listener = m.route.mode === "hash" ? "onhashchange" : "onpopstate";
      window[listener] = function() {
        if (currentRoute != normalizeRoute($location[m.route.mode])) {
          redirect($location[m.route.mode])
        }
      };
      computePostRedrawHook = setScroll;
      window[listener]()
    }
    //config: m.route
    else if (arguments[0].addEventListener) {
      var element = arguments[0];
      var isInitialized = arguments[1];
      var context = arguments[2];
      element.href = (m.route.mode !== 'pathname' ? $location.pathname : '') + modes[m.route.mode] + this.attrs.href;
      element.removeEventListener("click", routeUnobtrusive);
      element.addEventListener("click", routeUnobtrusive)
    }
    //m.route(route, params)
    else if (type.call(arguments[0]) === STRING) {
      currentRoute = arguments[0];
      var args = arguments[1] || {}
      var queryIndex = currentRoute.indexOf("?")
      var params = queryIndex > -1 ? parseQueryString(currentRoute.slice(queryIndex + 1)) : {}
      for (var i in args) params[i] = args[i]
      var querystring = buildQueryString(params)
      var currentPath = queryIndex > -1 ? currentRoute.slice(0, queryIndex) : currentRoute
      if (querystring) currentRoute = currentPath + (currentPath.indexOf("?") === -1 ? "?" : "&") + querystring;

      var shouldReplaceHistoryEntry = (arguments.length === 3 ? arguments[2] : arguments[1]) === true;

      if (window.history.pushState) {
        computePostRedrawHook = function() {
          window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](null, $document.title, modes[m.route.mode] + currentRoute);
          setScroll()
        };
        redirect(modes[m.route.mode] + currentRoute)
      }
      else $location[m.route.mode] = currentRoute
    }
  };
  m.route.param = function(key) {
    if (!routeParams) throw new Error("You must call m.route(element, defaultRoute, routes) before calling m.route.param()")
    return routeParams[key]
  };
  m.route.mode = "search";
  m.route.previous = function() {
    var previous;

    var route = m.route() || '/';
    if (route.length >= 1) {
      var arr = route.split('/');

      arr.pop();

      previous = arr.join('/');
    }
    else {
      previous = '/';
    }

    return previous;
  };

  m.route.back = function() {
    m.route(m.route.previous());
  };
  function normalizeRoute(route) {return route.slice(modes[m.route.mode].length)}
  function routeByValue(root, router, path) {
    routeParams = {};

    var queryStart = path.indexOf("?");
    if (queryStart !== -1) {
      routeParams = parseQueryString(path.substr(queryStart + 1, path.length));
      path = path.substr(0, queryStart)
    }

    for (var route in router) {
      if (route === path) {
        m.module(root, router[route]);
        return true
      }

      var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");

      if (matcher.test(path)) {
        path.replace(matcher, function() {
          var keys = route.match(/:[^\/]+/g) || [];
          var values = [].slice.call(arguments, 1, -2);
          for (var i = 0, len = keys.length; i < len; i++) routeParams[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
          m.module(root, router[route])
        });
        return true
      }
    }
  }
  function routeUnobtrusive(e) {
    e = e || event;
    if (e.ctrlKey || e.metaKey || e.which === 2) return;
    if (e.preventDefault) e.preventDefault();
    else e.returnValue = false;
    var currentTarget = e.currentTarget || this;
    var args = m.route.mode === "pathname" && currentTarget.search ? parseQueryString(currentTarget.search.slice(1)) : {};
    m.route(currentTarget[m.route.mode].slice(modes[m.route.mode].length), args)
  }
  function setScroll() {
    if (m.route.mode != "hash" && $location.hash) $location.hash = $location.hash;
    else window.scrollTo(0, 0)
  }
  function buildQueryString(object, prefix) {
    var str = [];
    for(var prop in object) {
      var key = prefix ? prefix + "[" + prop + "]" : prop, value = object[prop];
      str.push(value != null && type.call(value) === OBJECT ? buildQueryString(value, key) : encodeURIComponent(key) + "=" + encodeURIComponent(value))
    }
    return str.join("&")
  }
  function parseQueryString(str) {
    var pairs = str.split("&"), params = {};
    for (var i = 0, len = pairs.length; i < len; i++) {
      var pair = pairs[i].split("=");
      params[decodeSpace(pair[0])] = pair[1] ? decodeSpace(pair[1]) : ""
    }
    return params
  }
  function decodeSpace(string) {
    return decodeURIComponent(string.replace(/\+/g, " "))
  }
  function reset(root) {
    var cacheKey = getCellCacheKey(root);
    clear(root.childNodes, cellCache[cacheKey]);
    cellCache[cacheKey] = undefined
  }

  m.deferred = function () {
    var deferred = new Deferred();
    deferred.promise = propify(deferred.promise);
    return deferred
  };
  function propify(promise) {
    var prop = m.prop();
    promise.then(prop);
    prop.then = function(resolve, reject) {
      return propify(promise.then(resolve, reject))
    };
    return prop
  }
  //Promiz.mithril.js | Zolmeister | MIT
  //a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
  //1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
  //2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
  function Deferred(successCallback, failureCallback) {
    var RESOLVING = 1, REJECTING = 2, RESOLVED = 3, REJECTED = 4;
    var self = this, state = 0, promiseValue = 0, next = [];

    self["promise"] = {};

    self["resolve"] = function(value) {
      if (!state) {
        promiseValue = value;
        state = RESOLVING;

        fire()
      }
      return this
    };

    self["reject"] = function(value) {
      if (!state) {
        promiseValue = value;
        state = REJECTING;

        fire()
      }
      return this
    };

    self.promise["then"] = function(successCallback, failureCallback) {
      var deferred = new Deferred(successCallback, failureCallback);
      if (state === RESOLVED) {
        deferred.resolve(promiseValue)
      }
      else if (state === REJECTED) {
        deferred.reject(promiseValue)
      }
      else {
        next.push(deferred)
      }
      return deferred.promise
    };

    function finish(type) {
      state = type || REJECTED;
      next.map(function(deferred) {
        state === RESOLVED && deferred.resolve(promiseValue) || deferred.reject(promiseValue)
      })
    }

    function thennable(then, successCallback, failureCallback, notThennableCallback) {
      if (((promiseValue != null && type.call(promiseValue) === OBJECT) || typeof promiseValue === FUNCTION) && typeof then === FUNCTION) {
        try {
          // count protects against abuse calls from spec checker
          var count = 0;
          then.call(promiseValue, function(value) {
            if (count++) return;
            promiseValue = value;
            successCallback()
          }, function (value) {
            if (count++) return;
            promiseValue = value;
            failureCallback()
          })
        }
        catch (e) {
          m.deferred.onerror(e);
          promiseValue = e;
          failureCallback()
        }
      } else {
        notThennableCallback()
      }
    }

    function fire() {
      // check if it's a thenable
      var then;
      try {
        then = promiseValue && promiseValue.then
      }
      catch (e) {
        m.deferred.onerror(e);
        promiseValue = e;
        state = REJECTING;
        return fire()
      }
      thennable(then, function() {
        state = RESOLVING;
        fire()
      }, function() {
        state = REJECTING;
        fire()
      }, function() {
        try {
          if (state === RESOLVING && typeof successCallback === FUNCTION) {
            promiseValue = successCallback(promiseValue)
          }
          else if (state === REJECTING && typeof failureCallback === "function") {
            promiseValue = failureCallback(promiseValue);
            state = RESOLVING
          }
        }
        catch (e) {
          m.deferred.onerror(e);
          promiseValue = e;
          return finish()
        }

        if (promiseValue === self) {
          promiseValue = TypeError();
          finish()
        }
        else {
          thennable(then, function () {
            finish(RESOLVED)
          }, finish, function () {
            finish(state === RESOLVING && RESOLVED)
          })
        }
      })
    }
  }
  m.deferred.onerror = function(e) {
    if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) throw e
  };

  m.sync = function(args) {
    var method = "resolve";
    function synchronizer(pos, resolved) {
      return function(value) {
        results[pos] = value;
        if (!resolved) method = "reject";
        if (--outstanding === 0) {
          deferred.promise(results);
          deferred[method](results)
        }
        return value
      }
    }

    var deferred = m.deferred();
    var outstanding = args.length;
    var results = new Array(outstanding);
    if (args.length > 0) {
      for (var i = 0; i < args.length; i++) {
        args[i].then(synchronizer(i, true), synchronizer(i, false))
      }
    }
    else deferred.resolve([]);

    return deferred.promise
  };
  function identity(value) {return value}

  function ajax(options) {
    if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
      var callbackKey = "mithril_callback_" + new Date().getTime() + "_" + (Math.round(Math.random() * 1e16)).toString(36);
      var script = $document.createElement("script");

      window[callbackKey] = function(resp) {
        $document.body.removeChild(script);
        options.onload({
          type: "load",
          target: {
            responseText: resp
          }
        });
        window[callbackKey] = undefined
      };

      script.onerror = function(e) {
        $document.body.removeChild(script);

        options.onerror({
          type: "error",
          target: {
            status: 500,
            responseText: JSON.stringify({error: "Error making jsonp request"})
          }
        });
        window[callbackKey] = undefined;

        return false
      };

      script.onload = function(e) {
        return false
      };

      script.src = options.url
        + (options.url.indexOf("?") > 0 ? "&" : "?")
        + (options.callbackKey ? options.callbackKey : "callback")
        + "=" + callbackKey
        + "&" + buildQueryString(options.data || {});
      $document.body.appendChild(script)
    }
    else {
      var xhr = new window.XMLHttpRequest;
      xhr.open(options.method, options.url, true, options.user, options.password);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) options.onload({type: "load", target: xhr});
          else options.onerror({type: "error", target: xhr})
        }
      };
      if (options.serialize === JSON.stringify && options.data && options.method !== "GET") {
        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
      }
      if (options.deserialize === JSON.parse) {
        xhr.setRequestHeader("Accept", "application/json, text/*");
      }
      if (typeof options.config === FUNCTION) {
        var maybeXhr = options.config(xhr, options);
        if (maybeXhr != null) xhr = maybeXhr
      }

      var data = options.method === "GET" || !options.data ? "" : options.data
      if (data && (type.call(data) != STRING && data.constructor != window.FormData)) {
        throw "Request data should be either be a string or FormData. Check the `serialize` option in `m.request`";
      }
      xhr.send(data);
      return xhr
    }
  }
  function bindData(xhrOptions, data, serialize) {
    if (xhrOptions.method === "GET" && xhrOptions.dataType != "jsonp") {
      var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
      var querystring = buildQueryString(data);
      xhrOptions.url = xhrOptions.url + (querystring ? prefix + querystring : "")
    }
    else xhrOptions.data = serialize(data);
    return xhrOptions
  }
  function parameterizeUrl(url, data) {
    var tokens = url.match(/:[a-z]\w+/gi);
    if (tokens && data) {
      for (var i = 0; i < tokens.length; i++) {
        var key = tokens[i].slice(1);
        url = url.replace(tokens[i], data[key]);
        delete data[key]
      }
    }
    return url
  }

  m.request = function(xhrOptions) {
    if (xhrOptions.background !== true) m.startComputation();
    var deferred = m.deferred();
    var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp";
    var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
    var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
    var extract = xhrOptions.extract || function(xhr) {
      return xhr.responseText.length === 0 && deserialize === JSON.parse ? null : xhr.responseText
    };
    xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data);
    xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize);
    xhrOptions.onload = xhrOptions.onerror = function(e) {
      try {
        e = e || event;
        var unwrap = (e.type === "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity;
        var response = unwrap(deserialize(extract(e.target, xhrOptions)));
        if (e.type === "load") {
          if (type.call(response) === ARRAY && xhrOptions.type) {
            for (var i = 0; i < response.length; i++) response[i] = new xhrOptions.type(response[i])
          }
          else if (xhrOptions.type) response = new xhrOptions.type(response)
        }
        deferred[e.type === "load" ? "resolve" : "reject"](response)
      }
      catch (e) {
        m.deferred.onerror(e);
        deferred.reject(e)
      }
      if (xhrOptions.background !== true) m.endComputation()
    };
    ajax(xhrOptions);
    deferred.promise(xhrOptions.initialValue);
    return deferred.promise
  };

  //testing API
  m.deps = function(mock) {
    initialize(window = mock || window);
    return window;
  };
  //for internal testing only, do not use `m.deps.factory`
  m.deps.factory = app;

  return m
})(typeof window != "undefined" ? window : {});

if (typeof module != "undefined" && module !== null && module.exports) module.exports = m;
else if (typeof define === "function" && define.amd) define(function() {return m});

},{}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/about.js":[function(require,module,exports){
var Page = require('./page');

module.exports = Page({
  list: [
    { title: 'About1', url: '/about/one' },
    { title: 'About2', url: '/about/two' },
    { title: 'About3', url: '/about/three' },
    { title: 'About4', url: '/about/four' }
  ],
  title: 'About'
});

},{"./page":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/page.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/back.js":[function(require,module,exports){
// back.js

var m = require('mithril');

m.route.previous = function() {
  var delimiter = '/';
  var previous;

  var route = m.route() || delimiter;
  if (route.length >= 1) {
    var arr = route.split(delimiter);

    arr.pop();

    previous = arr.join(delimiter);
  }
  else {
    previous = delimiter;
  }

  return previous;
};
m.route.back = function() {
  m.route(m.route.previous());
};

var config = {
  onclick: m.route.back,
  style: {
    cursor: 'pointer'
  }
};

module.exports = m('.back', [
  m('a', config, 'Back')
]);

},{"mithril":"/Users/marc/Dev/FIDM/mithril-fidm-app/node_modules/mithril/mithril.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/body.js":[function(require,module,exports){
// body.js

var Body = function(config) {
  config = config || {};

  return function() {
    var list = config.list || [];

    return m("ul.list", [
      list.map(function(item) {
        var itemConfig = {
          config: m.route,
          href: item.url
        };

        return m("li", [
          m("a", itemConfig, item.title)
        ]);
      })
    ]);
  };
};

module.exports = Body;

},{}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/events.js":[function(require,module,exports){
// events.js

var Page = require('./page');

module.exports = Page({
  title: 'Events'
});

},{"./page":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/page.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/header.js":[function(require,module,exports){
// Header.js

var back = require('./back');

var header = function(config) {
  config = config || {};

  return function() {
    return [
      back,
      m('h1', config.title),
    ];
  };
};

module.exports = header;

},{"./back":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/back.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/layout.js":[function(require,module,exports){
var layout = function(header, body, tabs) {
  return m(".layout", [
    m("header", header),
    m("main", body),
    m("nav", tabs)
  ]);
};

module.exports = layout;

},{}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/mixinLayout.js":[function(require,module,exports){
var mixinLayout = function(config) {
  var layout = config.layout;
  var header = config.header;
  var body   = config.body;
  var tabs   = config.tabs;

  return function() {
    return layout(header(), body(), tabs());
  };
};

module.exports = mixinLayout;

},{}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-blogs.js":[function(require,module,exports){
var Page = require('./page');

module.exports = Page({
  list: [
    {title: 'FIDM News',          url: '/news/blogs/fidm-news'},
    {title: 'FIDM Museum',        url: '/news/blogs/fidm-museum'},
    {title: 'FIDM Digital Arts',  url: '/news/blogs/fidm-digital-arts'},
    {title: 'Fashion Club',       url: '/news/blogs/fashion-club'}
  ],
  title: 'News Blogs'
});

},{"./page":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/page.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-fashion-club.js":[function(require,module,exports){
var Page = require('./page');

module.exports = Page({
  title: 'Fashion Club'
});

},{"./page":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/page.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-fidm-digital-arts.js":[function(require,module,exports){
var Page = require('./page');

module.exports = Page({
  title: 'FIDM Digital Arts'
});

},{"./page":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/page.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-fidm-museum.js":[function(require,module,exports){
var Page = require('./page');

module.exports = Page({
  title: 'FIDM Museum'
});

},{"./page":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/page.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-fidm-news.js":[function(require,module,exports){
var Page = require('./page');

module.exports = Page({
  title: 'FIDM News'
});

},{"./page":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/page.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-topics.js":[function(require,module,exports){

},{}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news.js":[function(require,module,exports){
var Page = require('./page');

module.exports = Page({
  list: [
    { title: 'Blogs',  url: '/news/blogs' },
    { title: 'Topics', url: '/news/topics' },
    { title: 'Trends', url: '/news/trends' }
  ],
  title: 'News'
});

},{"./page":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/page.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/page.js":[function(require,module,exports){
// page.js

var mixinLayout = require("./mixinLayout");
var layout      = require("./layout");
var tabs        = require("./tabs");
var header      = require("./header");
var body        = require("./body");

var Page = function(config) {
  var title = config.title || "";
  var list  = config.list || [];
  return {
    controller: function() {},
    view: mixinLayout({
      layout : layout,
      header : header({title: title}),
      body   : body({list: list}),
      tabs   : tabs
    })
  };
};

module.exports = Page;

},{"./body":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/body.js","./header":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/header.js","./layout":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/layout.js","./mixinLayout":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/mixinLayout.js","./tabs":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/tabs.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/routes.js":[function(require,module,exports){
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

},{"./about":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/about.js","./events":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/events.js","./news":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news.js","./news-blogs":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-blogs.js","./news-fashion-club":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-fashion-club.js","./news-fidm-digital-arts":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-fidm-digital-arts.js","./news-fidm-museum":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-fidm-museum.js","./news-fidm-news":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-fidm-news.js","./news-topics":"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/news-topics.js"}],"/Users/marc/Dev/FIDM/mithril-fidm-app/src/scripts/tabs.js":[function(require,module,exports){
m = require('mithril');

var tab = function(config) {
  return m('a', {
      href: '/' + config.title.toLowerCase(),
      config: m.route
    },
    config.title
  );
};

var tabs = function() {
  return m('.tabs', [
    tab({title: 'News'  }),
    tab({title: 'Events'}),
    tab({title: 'About' })
  ]);
};

module.exports = tabs;

},{"mithril":"/Users/marc/Dev/FIDM/mithril-fidm-app/node_modules/mithril/mithril.js"}]},{},["./src/scripts/app.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9hcHAuanMiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIiwic3JjL3NjcmlwdHMvYWJvdXQuanMiLCJzcmMvc2NyaXB0cy9iYWNrLmpzIiwic3JjL3NjcmlwdHMvYm9keS5qcyIsInNyYy9zY3JpcHRzL2V2ZW50cy5qcyIsInNyYy9zY3JpcHRzL2hlYWRlci5qcyIsInNyYy9zY3JpcHRzL2xheW91dC5qcyIsInNyYy9zY3JpcHRzL21peGluTGF5b3V0LmpzIiwic3JjL3NjcmlwdHMvbmV3cy1ibG9ncy5qcyIsInNyYy9zY3JpcHRzL25ld3MtZmFzaGlvbi1jbHViLmpzIiwic3JjL3NjcmlwdHMvbmV3cy1maWRtLWRpZ2l0YWwtYXJ0cy5qcyIsInNyYy9zY3JpcHRzL25ld3MtZmlkbS1tdXNldW0uanMiLCJzcmMvc2NyaXB0cy9uZXdzLWZpZG0tbmV3cy5qcyIsInNyYy9zY3JpcHRzL25ld3MtdG9waWNzLmpzIiwic3JjL3NjcmlwdHMvbmV3cy5qcyIsInNyYy9zY3JpcHRzL3BhZ2UuanMiLCJzcmMvc2NyaXB0cy9yb3V0ZXMuanMiLCJzcmMvc2NyaXB0cy90YWJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVnQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gYXBwLmpzXG5cbnZhciBtID0gcmVxdWlyZSgnbWl0aHJpbCcpO1xuXG52YXIgcm91dGVzID0gcmVxdWlyZSgnLi9yb3V0ZXMnKTtcblxubS5yb3V0ZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXBwJyksIHJvdXRlcy5kZWZhdWx0LCByb3V0ZXMubWFwKTtcbiIsImNvbnNvbGUubG9nKCdteSBtaXRocmlsIScpO1xuXG5cbnZhciBtID0gKGZ1bmN0aW9uIGFwcCh3aW5kb3csIHVuZGVmaW5lZCkge1xuICB2YXIgT0JKRUNUID0gXCJbb2JqZWN0IE9iamVjdF1cIiwgQVJSQVkgPSBcIltvYmplY3QgQXJyYXldXCIsIFNUUklORyA9IFwiW29iamVjdCBTdHJpbmddXCIsIEZVTkNUSU9OID0gXCJmdW5jdGlvblwiO1xuICB2YXIgdHlwZSA9IHt9LnRvU3RyaW5nO1xuICB2YXIgcGFyc2VyID0gLyg/OihefCN8XFwuKShbXiNcXC5cXFtcXF1dKykpfChcXFsuKz9cXF0pL2csIGF0dHJQYXJzZXIgPSAvXFxbKC4rPykoPzo9KFwifCd8KSguKj8pXFwyKT9cXF0vO1xuICB2YXIgdm9pZEVsZW1lbnRzID0gL14oQVJFQXxCQVNFfEJSfENPTHxDT01NQU5EfEVNQkVEfEhSfElNR3xJTlBVVHxLRVlHRU58TElOS3xNRVRBfFBBUkFNfFNPVVJDRXxUUkFDS3xXQlIpJC87XG5cbiAgLy8gY2FjaGluZyBjb21tb25seSB1c2VkIHZhcmlhYmxlc1xuICB2YXIgJGRvY3VtZW50LCAkbG9jYXRpb24sICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUsICRjYW5jZWxBbmltYXRpb25GcmFtZTtcblxuICAvLyBzZWxmIGludm9raW5nIGZ1bmN0aW9uIG5lZWRlZCBiZWNhdXNlIG9mIHRoZSB3YXkgbW9ja3Mgd29ya1xuICBmdW5jdGlvbiBpbml0aWFsaXplKHdpbmRvdyl7XG4gICAgJGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xuICAgICRsb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgICAkY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LmNsZWFyVGltZW91dDtcbiAgICAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cuc2V0VGltZW91dDtcbiAgfVxuXG4gIGluaXRpYWxpemUod2luZG93KTtcblxuXG4gIC8qXG4gICAqIEB0eXBlZGVmIHtTdHJpbmd9IFRhZ1xuICAgKiBBIHN0cmluZyB0aGF0IGxvb2tzIGxpa2UgLT4gZGl2LmNsYXNzbmFtZSNpZFtwYXJhbT1vbmVdW3BhcmFtMj10d29dXG4gICAqIFdoaWNoIGRlc2NyaWJlcyBhIERPTSBub2RlXG4gICAqL1xuXG4gIC8qXG4gICAqXG4gICAqIEBwYXJhbSB7VGFnfSBUaGUgRE9NIG5vZGUgdGFnXG4gICAqIEBwYXJhbSB7T2JqZWN0PVtdfSBvcHRpb25hbCBrZXktdmFsdWUgcGFpcnMgdG8gYmUgbWFwcGVkIHRvIERPTSBhdHRyc1xuICAgKiBAcGFyYW0gey4uLm1Ob2RlPVtdfSBaZXJvIG9yIG1vcmUgTWl0aHJpbCBjaGlsZCBub2Rlcy4gQ2FuIGJlIGFuIGFycmF5LCBvciBzcGxhdCAob3B0aW9uYWwpXG4gICAqXG4gICAqL1xuICBmdW5jdGlvbiBtKCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIHZhciBoYXNBdHRycyA9IGFyZ3NbMV0gIT0gbnVsbCAmJiB0eXBlLmNhbGwoYXJnc1sxXSkgPT09IE9CSkVDVCAmJiAhKFwidGFnXCIgaW4gYXJnc1sxXSkgJiYgIShcInN1YnRyZWVcIiBpbiBhcmdzWzFdKTtcbiAgICB2YXIgYXR0cnMgPSBoYXNBdHRycyA/IGFyZ3NbMV0gOiB7fTtcbiAgICB2YXIgY2xhc3NBdHRyTmFtZSA9IFwiY2xhc3NcIiBpbiBhdHRycyA/IFwiY2xhc3NcIiA6IFwiY2xhc3NOYW1lXCI7XG4gICAgdmFyIGNlbGwgPSB7dGFnOiBcImRpdlwiLCBhdHRyczoge319O1xuICAgIHZhciBtYXRjaCwgY2xhc3NlcyA9IFtdO1xuICAgIGlmICh0eXBlLmNhbGwoYXJnc1swXSkgIT0gU1RSSU5HKSB0aHJvdyBuZXcgRXJyb3IoXCJzZWxlY3RvciBpbiBtKHNlbGVjdG9yLCBhdHRycywgY2hpbGRyZW4pIHNob3VsZCBiZSBhIHN0cmluZ1wiKVxuICAgIHdoaWxlIChtYXRjaCA9IHBhcnNlci5leGVjKGFyZ3NbMF0pKSB7XG4gICAgICBpZiAobWF0Y2hbMV0gPT09IFwiXCIgJiYgbWF0Y2hbMl0pIGNlbGwudGFnID0gbWF0Y2hbMl07XG4gICAgICBlbHNlIGlmIChtYXRjaFsxXSA9PT0gXCIjXCIpIGNlbGwuYXR0cnMuaWQgPSBtYXRjaFsyXTtcbiAgICAgIGVsc2UgaWYgKG1hdGNoWzFdID09PSBcIi5cIikgY2xhc3Nlcy5wdXNoKG1hdGNoWzJdKTtcbiAgICAgIGVsc2UgaWYgKG1hdGNoWzNdWzBdID09PSBcIltcIikge1xuICAgICAgICB2YXIgcGFpciA9IGF0dHJQYXJzZXIuZXhlYyhtYXRjaFszXSk7XG4gICAgICAgIGNlbGwuYXR0cnNbcGFpclsxXV0gPSBwYWlyWzNdIHx8IChwYWlyWzJdID8gXCJcIiA6dHJ1ZSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNsYXNzZXMubGVuZ3RoID4gMCkgY2VsbC5hdHRyc1tjbGFzc0F0dHJOYW1lXSA9IGNsYXNzZXMuam9pbihcIiBcIik7XG5cblxuICAgIHZhciBjaGlsZHJlbiA9IGhhc0F0dHJzID8gYXJnc1syXSA6IGFyZ3NbMV07XG4gICAgaWYgKHR5cGUuY2FsbChjaGlsZHJlbikgPT09IEFSUkFZKSB7XG4gICAgICBjZWxsLmNoaWxkcmVuID0gY2hpbGRyZW5cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjZWxsLmNoaWxkcmVuID0gaGFzQXR0cnMgPyBhcmdzLnNsaWNlKDIpIDogYXJncy5zbGljZSgxKVxuICAgIH1cblxuICAgIGZvciAodmFyIGF0dHJOYW1lIGluIGF0dHJzKSB7XG4gICAgICBpZiAoYXR0ck5hbWUgPT09IGNsYXNzQXR0ck5hbWUpIGNlbGwuYXR0cnNbYXR0ck5hbWVdID0gKGNlbGwuYXR0cnNbYXR0ck5hbWVdIHx8IFwiXCIpICsgXCIgXCIgKyBhdHRyc1thdHRyTmFtZV07XG4gICAgICBlbHNlIGNlbGwuYXR0cnNbYXR0ck5hbWVdID0gYXR0cnNbYXR0ck5hbWVdXG4gICAgfVxuICAgIHJldHVybiBjZWxsXG4gIH1cbiAgZnVuY3Rpb24gYnVpbGQocGFyZW50RWxlbWVudCwgcGFyZW50VGFnLCBwYXJlbnRDYWNoZSwgcGFyZW50SW5kZXgsIGRhdGEsIGNhY2hlZCwgc2hvdWxkUmVhdHRhY2gsIGluZGV4LCBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKSB7XG4gICAgLy9gYnVpbGRgIGlzIGEgcmVjdXJzaXZlIGZ1bmN0aW9uIHRoYXQgbWFuYWdlcyBjcmVhdGlvbi9kaWZmaW5nL3JlbW92YWwgb2YgRE9NIGVsZW1lbnRzIGJhc2VkIG9uIGNvbXBhcmlzb24gYmV0d2VlbiBgZGF0YWAgYW5kIGBjYWNoZWRgXG4gICAgLy90aGUgZGlmZiBhbGdvcml0aG0gY2FuIGJlIHN1bW1hcml6ZWQgYXMgdGhpczpcbiAgICAvLzEgLSBjb21wYXJlIGBkYXRhYCBhbmQgYGNhY2hlZGBcbiAgICAvLzIgLSBpZiB0aGV5IGFyZSBkaWZmZXJlbnQsIGNvcHkgYGRhdGFgIHRvIGBjYWNoZWRgIGFuZCB1cGRhdGUgdGhlIERPTSBiYXNlZCBvbiB3aGF0IHRoZSBkaWZmZXJlbmNlIGlzXG4gICAgLy8zIC0gcmVjdXJzaXZlbHkgYXBwbHkgdGhpcyBhbGdvcml0aG0gZm9yIGV2ZXJ5IGFycmF5IGFuZCBmb3IgdGhlIGNoaWxkcmVuIG9mIGV2ZXJ5IHZpcnR1YWwgZWxlbWVudFxuXG4gICAgLy90aGUgYGNhY2hlZGAgZGF0YSBzdHJ1Y3R1cmUgaXMgZXNzZW50aWFsbHkgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzIHJlZHJhdydzIGBkYXRhYCBkYXRhIHN0cnVjdHVyZSwgd2l0aCBhIGZldyBhZGRpdGlvbnM6XG4gICAgLy8tIGBjYWNoZWRgIGFsd2F5cyBoYXMgYSBwcm9wZXJ0eSBjYWxsZWQgYG5vZGVzYCwgd2hpY2ggaXMgYSBsaXN0IG9mIERPTSBlbGVtZW50cyB0aGF0IGNvcnJlc3BvbmQgdG8gdGhlIGRhdGEgcmVwcmVzZW50ZWQgYnkgdGhlIHJlc3BlY3RpdmUgdmlydHVhbCBlbGVtZW50XG4gICAgLy8tIGluIG9yZGVyIHRvIHN1cHBvcnQgYXR0YWNoaW5nIGBub2Rlc2AgYXMgYSBwcm9wZXJ0eSBvZiBgY2FjaGVkYCwgYGNhY2hlZGAgaXMgKmFsd2F5cyogYSBub24tcHJpbWl0aXZlIG9iamVjdCwgaS5lLiBpZiB0aGUgZGF0YSB3YXMgYSBzdHJpbmcsIHRoZW4gY2FjaGVkIGlzIGEgU3RyaW5nIGluc3RhbmNlLiBJZiBkYXRhIHdhcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAsIGNhY2hlZCBpcyBgbmV3IFN0cmluZyhcIlwiKWBcbiAgICAvLy0gYGNhY2hlZCBhbHNvIGhhcyBhIGBjb25maWdDb250ZXh0YCBwcm9wZXJ0eSwgd2hpY2ggaXMgdGhlIHN0YXRlIHN0b3JhZ2Ugb2JqZWN0IGV4cG9zZWQgYnkgY29uZmlnKGVsZW1lbnQsIGlzSW5pdGlhbGl6ZWQsIGNvbnRleHQpXG4gICAgLy8tIHdoZW4gYGNhY2hlZGAgaXMgYW4gT2JqZWN0LCBpdCByZXByZXNlbnRzIGEgdmlydHVhbCBlbGVtZW50OyB3aGVuIGl0J3MgYW4gQXJyYXksIGl0IHJlcHJlc2VudHMgYSBsaXN0IG9mIGVsZW1lbnRzOyB3aGVuIGl0J3MgYSBTdHJpbmcsIE51bWJlciBvciBCb29sZWFuLCBpdCByZXByZXNlbnRzIGEgdGV4dCBub2RlXG5cbiAgICAvL2BwYXJlbnRFbGVtZW50YCBpcyBhIERPTSBlbGVtZW50IHVzZWQgZm9yIFczQyBET00gQVBJIGNhbGxzXG4gICAgLy9gcGFyZW50VGFnYCBpcyBvbmx5IHVzZWQgZm9yIGhhbmRsaW5nIGEgY29ybmVyIGNhc2UgZm9yIHRleHRhcmVhIHZhbHVlc1xuICAgIC8vYHBhcmVudENhY2hlYCBpcyB1c2VkIHRvIHJlbW92ZSBub2RlcyBpbiBzb21lIG11bHRpLW5vZGUgY2FzZXNcbiAgICAvL2BwYXJlbnRJbmRleGAgYW5kIGBpbmRleGAgYXJlIHVzZWQgdG8gZmlndXJlIG91dCB0aGUgb2Zmc2V0IG9mIG5vZGVzLiBUaGV5J3JlIGFydGlmYWN0cyBmcm9tIGJlZm9yZSBhcnJheXMgc3RhcnRlZCBiZWluZyBmbGF0dGVuZWQgYW5kIGFyZSBsaWtlbHkgcmVmYWN0b3JhYmxlXG4gICAgLy9gZGF0YWAgYW5kIGBjYWNoZWRgIGFyZSwgcmVzcGVjdGl2ZWx5LCB0aGUgbmV3IGFuZCBvbGQgbm9kZXMgYmVpbmcgZGlmZmVkXG4gICAgLy9gc2hvdWxkUmVhdHRhY2hgIGlzIGEgZmxhZyBpbmRpY2F0aW5nIHdoZXRoZXIgYSBwYXJlbnQgbm9kZSB3YXMgcmVjcmVhdGVkIChpZiBzbywgYW5kIGlmIHRoaXMgbm9kZSBpcyByZXVzZWQsIHRoZW4gdGhpcyBub2RlIG11c3QgcmVhdHRhY2ggaXRzZWxmIHRvIHRoZSBuZXcgcGFyZW50KVxuICAgIC8vYGVkaXRhYmxlYCBpcyBhIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhbiBhbmNlc3RvciBpcyBjb250ZW50ZWRpdGFibGVcbiAgICAvL2BuYW1lc3BhY2VgIGluZGljYXRlcyB0aGUgY2xvc2VzdCBIVE1MIG5hbWVzcGFjZSBhcyBpdCBjYXNjYWRlcyBkb3duIGZyb20gYW4gYW5jZXN0b3JcbiAgICAvL2Bjb25maWdzYCBpcyBhIGxpc3Qgb2YgY29uZmlnIGZ1bmN0aW9ucyB0byBydW4gYWZ0ZXIgdGhlIHRvcG1vc3QgYGJ1aWxkYCBjYWxsIGZpbmlzaGVzIHJ1bm5pbmdcblxuICAgIC8vdGhlcmUncyBsb2dpYyB0aGF0IHJlbGllcyBvbiB0aGUgYXNzdW1wdGlvbiB0aGF0IG51bGwgYW5kIHVuZGVmaW5lZCBkYXRhIGFyZSBlcXVpdmFsZW50IHRvIGVtcHR5IHN0cmluZ3NcbiAgICAvLy0gdGhpcyBwcmV2ZW50cyBsaWZlY3ljbGUgc3VycHJpc2VzIGZyb20gcHJvY2VkdXJhbCBoZWxwZXJzIHRoYXQgbWl4IGltcGxpY2l0IGFuZCBleHBsaWNpdCByZXR1cm4gc3RhdGVtZW50cyAoZS5nLiBmdW5jdGlvbiBmb28oKSB7aWYgKGNvbmQpIHJldHVybiBtKFwiZGl2XCIpfVxuICAgIC8vLSBpdCBzaW1wbGlmaWVzIGRpZmZpbmcgY29kZVxuICAgIC8vZGF0YS50b1N0cmluZygpIGlzIG51bGwgaWYgZGF0YSBpcyB0aGUgcmV0dXJuIHZhbHVlIG9mIENvbnNvbGUubG9nIGluIEZpcmVmb3hcbiAgICBpZiAoZGF0YSA9PSBudWxsIHx8IGRhdGEudG9TdHJpbmcoKSA9PSBudWxsKSBkYXRhID0gXCJcIjtcbiAgICBpZiAoZGF0YS5zdWJ0cmVlID09PSBcInJldGFpblwiKSByZXR1cm4gY2FjaGVkO1xuICAgIHZhciBjYWNoZWRUeXBlID0gdHlwZS5jYWxsKGNhY2hlZCksIGRhdGFUeXBlID0gdHlwZS5jYWxsKGRhdGEpO1xuICAgIGlmIChjYWNoZWQgPT0gbnVsbCB8fCBjYWNoZWRUeXBlICE9PSBkYXRhVHlwZSkge1xuICAgICAgaWYgKGNhY2hlZCAhPSBudWxsKSB7XG4gICAgICAgIGlmIChwYXJlbnRDYWNoZSAmJiBwYXJlbnRDYWNoZS5ub2Rlcykge1xuICAgICAgICAgIHZhciBvZmZzZXQgPSBpbmRleCAtIHBhcmVudEluZGV4O1xuICAgICAgICAgIHZhciBlbmQgPSBvZmZzZXQgKyAoZGF0YVR5cGUgPT09IEFSUkFZID8gZGF0YSA6IGNhY2hlZC5ub2RlcykubGVuZ3RoO1xuICAgICAgICAgIGNsZWFyKHBhcmVudENhY2hlLm5vZGVzLnNsaWNlKG9mZnNldCwgZW5kKSwgcGFyZW50Q2FjaGUuc2xpY2Uob2Zmc2V0LCBlbmQpKVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNhY2hlZC5ub2RlcykgY2xlYXIoY2FjaGVkLm5vZGVzLCBjYWNoZWQpXG4gICAgICB9XG4gICAgICBjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcjtcbiAgICAgIGlmIChjYWNoZWQudGFnKSBjYWNoZWQgPSB7fTsgLy9pZiBjb25zdHJ1Y3RvciBjcmVhdGVzIGEgdmlydHVhbCBkb20gZWxlbWVudCwgdXNlIGEgYmxhbmsgb2JqZWN0IGFzIHRoZSBiYXNlIGNhY2hlZCBub2RlIGluc3RlYWQgb2YgY29weWluZyB0aGUgdmlydHVhbCBlbCAoIzI3NylcbiAgICAgIGNhY2hlZC5ub2RlcyA9IFtdXG4gICAgfVxuXG4gICAgaWYgKGRhdGFUeXBlID09PSBBUlJBWSkge1xuICAgICAgLy9yZWN1cnNpdmVseSBmbGF0dGVuIGFycmF5XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAodHlwZS5jYWxsKGRhdGFbaV0pID09PSBBUlJBWSkge1xuICAgICAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdC5hcHBseShbXSwgZGF0YSk7XG4gICAgICAgICAgaS0tIC8vY2hlY2sgY3VycmVudCBpbmRleCBhZ2FpbiBhbmQgZmxhdHRlbiB1bnRpbCB0aGVyZSBhcmUgbm8gbW9yZSBuZXN0ZWQgYXJyYXlzIGF0IHRoYXQgaW5kZXhcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgbm9kZXMgPSBbXSwgaW50YWN0ID0gY2FjaGVkLmxlbmd0aCA9PT0gZGF0YS5sZW5ndGgsIHN1YkFycmF5Q291bnQgPSAwO1xuXG4gICAgICAvL2tleXMgYWxnb3JpdGhtOiBzb3J0IGVsZW1lbnRzIHdpdGhvdXQgcmVjcmVhdGluZyB0aGVtIGlmIGtleXMgYXJlIHByZXNlbnRcbiAgICAgIC8vMSkgY3JlYXRlIGEgbWFwIG9mIGFsbCBleGlzdGluZyBrZXlzLCBhbmQgbWFyayBhbGwgZm9yIGRlbGV0aW9uXG4gICAgICAvLzIpIGFkZCBuZXcga2V5cyB0byBtYXAgYW5kIG1hcmsgdGhlbSBmb3IgYWRkaXRpb25cbiAgICAgIC8vMykgaWYga2V5IGV4aXN0cyBpbiBuZXcgbGlzdCwgY2hhbmdlIGFjdGlvbiBmcm9tIGRlbGV0aW9uIHRvIGEgbW92ZVxuICAgICAgLy80KSBmb3IgZWFjaCBrZXksIGhhbmRsZSBpdHMgY29ycmVzcG9uZGluZyBhY3Rpb24gYXMgbWFya2VkIGluIHByZXZpb3VzIHN0ZXBzXG4gICAgICAvLzUpIGNvcHkgdW5rZXllZCBpdGVtcyBpbnRvIHRoZWlyIHJlc3BlY3RpdmUgZ2Fwc1xuICAgICAgdmFyIERFTEVUSU9OID0gMSwgSU5TRVJUSU9OID0gMiAsIE1PVkUgPSAzO1xuICAgICAgdmFyIGV4aXN0aW5nID0ge30sIHVua2V5ZWQgPSBbXSwgc2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzID0gZmFsc2U7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhY2hlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoY2FjaGVkW2ldICYmIGNhY2hlZFtpXS5hdHRycyAmJiBjYWNoZWRbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcbiAgICAgICAgICBzaG91bGRNYWludGFpbklkZW50aXRpZXMgPSB0cnVlO1xuICAgICAgICAgIGV4aXN0aW5nW2NhY2hlZFtpXS5hdHRycy5rZXldID0ge2FjdGlvbjogREVMRVRJT04sIGluZGV4OiBpfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzKSB7XG4gICAgICAgIGlmIChkYXRhLmluZGV4T2YobnVsbCkgPiAtMSkgZGF0YSA9IGRhdGEuZmlsdGVyKGZ1bmN0aW9uKHgpIHtyZXR1cm4geCAhPSBudWxsfSlcblxuICAgICAgICB2YXIga2V5c0RpZmZlciA9IGZhbHNlXG4gICAgICAgIGlmIChkYXRhLmxlbmd0aCAhPSBjYWNoZWQubGVuZ3RoKSBrZXlzRGlmZmVyID0gdHJ1ZVxuICAgICAgICBlbHNlIGZvciAodmFyIGkgPSAwLCBjYWNoZWRDZWxsLCBkYXRhQ2VsbDsgY2FjaGVkQ2VsbCA9IGNhY2hlZFtpXSwgZGF0YUNlbGwgPSBkYXRhW2ldOyBpKyspIHtcbiAgICAgICAgICBpZiAoY2FjaGVkQ2VsbC5hdHRycyAmJiBkYXRhQ2VsbC5hdHRycyAmJiBjYWNoZWRDZWxsLmF0dHJzLmtleSAhPSBkYXRhQ2VsbC5hdHRycy5rZXkpIHtcbiAgICAgICAgICAgIGtleXNEaWZmZXIgPSB0cnVlXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXlzRGlmZmVyKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChkYXRhW2ldICYmIGRhdGFbaV0uYXR0cnMpIHtcbiAgICAgICAgICAgICAgaWYgKGRhdGFbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gZGF0YVtpXS5hdHRycy5rZXk7XG4gICAgICAgICAgICAgICAgaWYgKCFleGlzdGluZ1trZXldKSBleGlzdGluZ1trZXldID0ge2FjdGlvbjogSU5TRVJUSU9OLCBpbmRleDogaX07XG4gICAgICAgICAgICAgICAgZWxzZSBleGlzdGluZ1trZXldID0ge1xuICAgICAgICAgICAgICAgICAgYWN0aW9uOiBNT1ZFLFxuICAgICAgICAgICAgICAgICAgaW5kZXg6IGksXG4gICAgICAgICAgICAgICAgICBmcm9tOiBleGlzdGluZ1trZXldLmluZGV4LFxuICAgICAgICAgICAgICAgICAgZWxlbWVudDogcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2V4aXN0aW5nW2tleV0uaW5kZXhdIHx8ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2UgdW5rZXllZC5wdXNoKHtpbmRleDogaSwgZWxlbWVudDogcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2ldIHx8ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGFjdGlvbnMgPSBbXVxuICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gZXhpc3RpbmcpIGFjdGlvbnMucHVzaChleGlzdGluZ1twcm9wXSlcbiAgICAgICAgICB2YXIgY2hhbmdlcyA9IGFjdGlvbnMuc29ydChzb3J0Q2hhbmdlcyk7XG4gICAgICAgICAgdmFyIG5ld0NhY2hlZCA9IG5ldyBBcnJheShjYWNoZWQubGVuZ3RoKVxuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGNoYW5nZTsgY2hhbmdlID0gY2hhbmdlc1tpXTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoY2hhbmdlLmFjdGlvbiA9PT0gREVMRVRJT04pIHtcbiAgICAgICAgICAgICAgY2xlYXIoY2FjaGVkW2NoYW5nZS5pbmRleF0ubm9kZXMsIGNhY2hlZFtjaGFuZ2UuaW5kZXhdKTtcbiAgICAgICAgICAgICAgbmV3Q2FjaGVkLnNwbGljZShjaGFuZ2UuaW5kZXgsIDEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2hhbmdlLmFjdGlvbiA9PT0gSU5TRVJUSU9OKSB7XG4gICAgICAgICAgICAgIHZhciBkdW1teSA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICBkdW1teS5rZXkgPSBkYXRhW2NoYW5nZS5pbmRleF0uYXR0cnMua2V5O1xuICAgICAgICAgICAgICBwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShkdW1teSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2NoYW5nZS5pbmRleF0gfHwgbnVsbCk7XG4gICAgICAgICAgICAgIG5ld0NhY2hlZC5zcGxpY2UoY2hhbmdlLmluZGV4LCAwLCB7YXR0cnM6IHtrZXk6IGRhdGFbY2hhbmdlLmluZGV4XS5hdHRycy5rZXl9LCBub2RlczogW2R1bW15XX0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjaGFuZ2UuYWN0aW9uID09PSBNT1ZFKSB7XG4gICAgICAgICAgICAgIGlmIChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbY2hhbmdlLmluZGV4XSAhPT0gY2hhbmdlLmVsZW1lbnQgJiYgY2hhbmdlLmVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShjaGFuZ2UuZWxlbWVudCwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2NoYW5nZS5pbmRleF0gfHwgbnVsbClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBuZXdDYWNoZWRbY2hhbmdlLmluZGV4XSA9IGNhY2hlZFtjaGFuZ2UuZnJvbV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHVua2V5ZWQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGFuZ2UgPSB1bmtleWVkW2ldO1xuICAgICAgICAgICAgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUoY2hhbmdlLmVsZW1lbnQsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdIHx8IG51bGwpO1xuICAgICAgICAgICAgbmV3Q2FjaGVkW2NoYW5nZS5pbmRleF0gPSBjYWNoZWRbY2hhbmdlLmluZGV4XVxuICAgICAgICAgIH1cbiAgICAgICAgICBjYWNoZWQgPSBuZXdDYWNoZWQ7XG4gICAgICAgICAgY2FjaGVkLm5vZGVzID0gbmV3IEFycmF5KHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlcy5sZW5ndGgpO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBjaGlsZDsgY2hpbGQgPSBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaV07IGkrKykgY2FjaGVkLm5vZGVzW2ldID0gY2hpbGRcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy9lbmQga2V5IGFsZ29yaXRobVxuXG4gICAgICBmb3IgKHZhciBpID0gMCwgY2FjaGVDb3VudCA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgLy9kaWZmIGVhY2ggaXRlbSBpbiB0aGUgYXJyYXlcbiAgICAgICAgdmFyIGl0ZW0gPSBidWlsZChwYXJlbnRFbGVtZW50LCBwYXJlbnRUYWcsIGNhY2hlZCwgaW5kZXgsIGRhdGFbaV0sIGNhY2hlZFtjYWNoZUNvdW50XSwgc2hvdWxkUmVhdHRhY2gsIGluZGV4ICsgc3ViQXJyYXlDb3VudCB8fCBzdWJBcnJheUNvdW50LCBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKTtcbiAgICAgICAgaWYgKGl0ZW0gPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICAgIGlmICghaXRlbS5ub2Rlcy5pbnRhY3QpIGludGFjdCA9IGZhbHNlO1xuICAgICAgICBpZiAoaXRlbS4kdHJ1c3RlZCkge1xuICAgICAgICAgIC8vZml4IG9mZnNldCBvZiBuZXh0IGVsZW1lbnQgaWYgaXRlbSB3YXMgYSB0cnVzdGVkIHN0cmluZyB3LyBtb3JlIHRoYW4gb25lIGh0bWwgZWxlbWVudFxuICAgICAgICAgIC8vdGhlIGZpcnN0IGNsYXVzZSBpbiB0aGUgcmVnZXhwIG1hdGNoZXMgZWxlbWVudHNcbiAgICAgICAgICAvL3RoZSBzZWNvbmQgY2xhdXNlIChhZnRlciB0aGUgcGlwZSkgbWF0Y2hlcyB0ZXh0IG5vZGVzXG4gICAgICAgICAgc3ViQXJyYXlDb3VudCArPSAoaXRlbS5tYXRjaCgvPFteXFwvXXxcXD5cXHMqW148XS9nKSB8fCBbXSkubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBzdWJBcnJheUNvdW50ICs9IHR5cGUuY2FsbChpdGVtKSA9PT0gQVJSQVkgPyBpdGVtLmxlbmd0aCA6IDE7XG4gICAgICAgIGNhY2hlZFtjYWNoZUNvdW50KytdID0gaXRlbVxuICAgICAgfVxuICAgICAgaWYgKCFpbnRhY3QpIHtcbiAgICAgICAgLy9kaWZmIHRoZSBhcnJheSBpdHNlbGZcblxuICAgICAgICAvL3VwZGF0ZSB0aGUgbGlzdCBvZiBET00gbm9kZXMgYnkgY29sbGVjdGluZyB0aGUgbm9kZXMgZnJvbSBlYWNoIGl0ZW1cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBpZiAoY2FjaGVkW2ldICE9IG51bGwpIG5vZGVzLnB1c2guYXBwbHkobm9kZXMsIGNhY2hlZFtpXS5ub2RlcylcbiAgICAgICAgfVxuICAgICAgICAvL3JlbW92ZSBpdGVtcyBmcm9tIHRoZSBlbmQgb2YgdGhlIGFycmF5IGlmIHRoZSBuZXcgYXJyYXkgaXMgc2hvcnRlciB0aGFuIHRoZSBvbGQgb25lXG4gICAgICAgIC8vaWYgZXJyb3JzIGV2ZXIgaGFwcGVuIGhlcmUsIHRoZSBpc3N1ZSBpcyBtb3N0IGxpa2VseSBhIGJ1ZyBpbiB0aGUgY29uc3RydWN0aW9uIG9mIHRoZSBgY2FjaGVkYCBkYXRhIHN0cnVjdHVyZSBzb21ld2hlcmUgZWFybGllciBpbiB0aGUgcHJvZ3JhbVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbm9kZTsgbm9kZSA9IGNhY2hlZC5ub2Rlc1tpXTsgaSsrKSB7XG4gICAgICAgICAgaWYgKG5vZGUucGFyZW50Tm9kZSAhPSBudWxsICYmIG5vZGVzLmluZGV4T2Yobm9kZSkgPCAwKSBjbGVhcihbbm9kZV0sIFtjYWNoZWRbaV1dKVxuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmxlbmd0aCA8IGNhY2hlZC5sZW5ndGgpIGNhY2hlZC5sZW5ndGggPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgY2FjaGVkLm5vZGVzID0gbm9kZXNcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoZGF0YSAhPSBudWxsICYmIGRhdGFUeXBlID09PSBPQkpFQ1QpIHtcbiAgICAgIGlmICghZGF0YS5hdHRycykgZGF0YS5hdHRycyA9IHt9O1xuICAgICAgaWYgKCFjYWNoZWQuYXR0cnMpIGNhY2hlZC5hdHRycyA9IHt9O1xuXG4gICAgICB2YXIgZGF0YUF0dHJLZXlzID0gT2JqZWN0LmtleXMoZGF0YS5hdHRycylcbiAgICAgIHZhciBoYXNLZXlzID0gZGF0YUF0dHJLZXlzLmxlbmd0aCA+IChcImtleVwiIGluIGRhdGEuYXR0cnMgPyAxIDogMClcbiAgICAgIC8vaWYgYW4gZWxlbWVudCBpcyBkaWZmZXJlbnQgZW5vdWdoIGZyb20gdGhlIG9uZSBpbiBjYWNoZSwgcmVjcmVhdGUgaXRcbiAgICAgIGlmIChkYXRhLnRhZyAhPSBjYWNoZWQudGFnIHx8IGRhdGFBdHRyS2V5cy5qb2luKCkgIT0gT2JqZWN0LmtleXMoY2FjaGVkLmF0dHJzKS5qb2luKCkgfHwgZGF0YS5hdHRycy5pZCAhPSBjYWNoZWQuYXR0cnMuaWQpIHtcbiAgICAgICAgaWYgKGNhY2hlZC5ub2Rlcy5sZW5ndGgpIGNsZWFyKGNhY2hlZC5ub2Rlcyk7XG4gICAgICAgIGlmIChjYWNoZWQuY29uZmlnQ29udGV4dCAmJiB0eXBlb2YgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPT09IEZVTkNUSU9OKSBjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCgpXG4gICAgICB9XG4gICAgICBpZiAodHlwZS5jYWxsKGRhdGEudGFnKSAhPSBTVFJJTkcpIHJldHVybjtcblxuICAgICAgdmFyIG5vZGUsIGlzTmV3ID0gY2FjaGVkLm5vZGVzLmxlbmd0aCA9PT0gMDtcbiAgICAgIGlmIChkYXRhLmF0dHJzLnhtbG5zKSBuYW1lc3BhY2UgPSBkYXRhLmF0dHJzLnhtbG5zO1xuICAgICAgZWxzZSBpZiAoZGF0YS50YWcgPT09IFwic3ZnXCIpIG5hbWVzcGFjZSA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcbiAgICAgIGVsc2UgaWYgKGRhdGEudGFnID09PSBcIm1hdGhcIikgbmFtZXNwYWNlID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MXCI7XG4gICAgICBpZiAoaXNOZXcpIHtcbiAgICAgICAgaWYgKGRhdGEuYXR0cnMuaXMpIG5vZGUgPSBuYW1lc3BhY2UgPT09IHVuZGVmaW5lZCA/ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRhdGEudGFnLCBkYXRhLmF0dHJzLmlzKSA6ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBkYXRhLnRhZywgZGF0YS5hdHRycy5pcyk7XG4gICAgICAgIGVsc2Ugbm9kZSA9IG5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkID8gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZGF0YS50YWcpIDogJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIGRhdGEudGFnKTtcbiAgICAgICAgY2FjaGVkID0ge1xuICAgICAgICAgIHRhZzogZGF0YS50YWcsXG4gICAgICAgICAgLy9zZXQgYXR0cmlidXRlcyBmaXJzdCwgdGhlbiBjcmVhdGUgY2hpbGRyZW5cbiAgICAgICAgICBhdHRyczogaGFzS2V5cyA/IHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMsIHt9LCBuYW1lc3BhY2UpIDogZGF0YS5hdHRycyxcbiAgICAgICAgICBjaGlsZHJlbjogZGF0YS5jaGlsZHJlbiAhPSBudWxsICYmIGRhdGEuY2hpbGRyZW4ubGVuZ3RoID4gMCA/XG4gICAgICAgICAgICBidWlsZChub2RlLCBkYXRhLnRhZywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGRhdGEuY2hpbGRyZW4sIGNhY2hlZC5jaGlsZHJlbiwgdHJ1ZSwgMCwgZGF0YS5hdHRycy5jb250ZW50ZWRpdGFibGUgPyBub2RlIDogZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncykgOlxuICAgICAgICAgICAgZGF0YS5jaGlsZHJlbixcbiAgICAgICAgICBub2RlczogW25vZGVdXG4gICAgICAgIH07XG4gICAgICAgIGlmIChjYWNoZWQuY2hpbGRyZW4gJiYgIWNhY2hlZC5jaGlsZHJlbi5ub2RlcykgY2FjaGVkLmNoaWxkcmVuLm5vZGVzID0gW107XG4gICAgICAgIC8vZWRnZSBjYXNlOiBzZXR0aW5nIHZhbHVlIG9uIDxzZWxlY3Q+IGRvZXNuJ3Qgd29yayBiZWZvcmUgY2hpbGRyZW4gZXhpc3QsIHNvIHNldCBpdCBhZ2FpbiBhZnRlciBjaGlsZHJlbiBoYXZlIGJlZW4gY3JlYXRlZFxuICAgICAgICBpZiAoZGF0YS50YWcgPT09IFwic2VsZWN0XCIgJiYgZGF0YS5hdHRycy52YWx1ZSkgc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywge3ZhbHVlOiBkYXRhLmF0dHJzLnZhbHVlfSwge30sIG5hbWVzcGFjZSk7XG4gICAgICAgIHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBub2RlID0gY2FjaGVkLm5vZGVzWzBdO1xuICAgICAgICBpZiAoaGFzS2V5cykgc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywgZGF0YS5hdHRycywgY2FjaGVkLmF0dHJzLCBuYW1lc3BhY2UpO1xuICAgICAgICBjYWNoZWQuY2hpbGRyZW4gPSBidWlsZChub2RlLCBkYXRhLnRhZywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGRhdGEuY2hpbGRyZW4sIGNhY2hlZC5jaGlsZHJlbiwgZmFsc2UsIDAsIGRhdGEuYXR0cnMuY29udGVudGVkaXRhYmxlID8gbm9kZSA6IGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpO1xuICAgICAgICBjYWNoZWQubm9kZXMuaW50YWN0ID0gdHJ1ZTtcbiAgICAgICAgaWYgKHNob3VsZFJlYXR0YWNoID09PSB0cnVlICYmIG5vZGUgIT0gbnVsbCkgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxuICAgICAgfVxuICAgICAgLy9zY2hlZHVsZSBjb25maWdzIHRvIGJlIGNhbGxlZC4gVGhleSBhcmUgY2FsbGVkIGFmdGVyIGBidWlsZGAgZmluaXNoZXMgcnVubmluZ1xuICAgICAgaWYgKHR5cGVvZiBkYXRhLmF0dHJzW1wiY29uZmlnXCJdID09PSBGVU5DVElPTikge1xuICAgICAgICB2YXIgY29udGV4dCA9IGNhY2hlZC5jb25maWdDb250ZXh0ID0gY2FjaGVkLmNvbmZpZ0NvbnRleHQgfHwge307XG5cbiAgICAgICAgLy8gYmluZFxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihkYXRhLCBhcmdzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEuYXR0cnNbXCJjb25maWdcIl0uYXBwbHkoZGF0YSwgYXJncylcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbmZpZ3MucHVzaChjYWxsYmFjayhkYXRhLCBbbm9kZSwgIWlzTmV3LCBjb250ZXh0LCBjYWNoZWRdKSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRhdGFUeXBlICE9IEZVTkNUSU9OKSB7XG4gICAgICAvL2hhbmRsZSB0ZXh0IG5vZGVzXG4gICAgICB2YXIgbm9kZXM7XG4gICAgICBpZiAoY2FjaGVkLm5vZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBpZiAoZGF0YS4kdHJ1c3RlZCkge1xuICAgICAgICAgIG5vZGVzID0gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSlcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBub2RlcyA9IFskZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSldO1xuICAgICAgICAgIGlmICghcGFyZW50RWxlbWVudC5ub2RlTmFtZS5tYXRjaCh2b2lkRWxlbWVudHMpKSBwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2Rlc1swXSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxuICAgICAgICB9XG4gICAgICAgIGNhY2hlZCA9IFwic3RyaW5nIG51bWJlciBib29sZWFuXCIuaW5kZXhPZih0eXBlb2YgZGF0YSkgPiAtMSA/IG5ldyBkYXRhLmNvbnN0cnVjdG9yKGRhdGEpIDogZGF0YTtcbiAgICAgICAgY2FjaGVkLm5vZGVzID0gbm9kZXNcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGNhY2hlZC52YWx1ZU9mKCkgIT09IGRhdGEudmFsdWVPZigpIHx8IHNob3VsZFJlYXR0YWNoID09PSB0cnVlKSB7XG4gICAgICAgIG5vZGVzID0gY2FjaGVkLm5vZGVzO1xuICAgICAgICBpZiAoIWVkaXRhYmxlIHx8IGVkaXRhYmxlICE9PSAkZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xuICAgICAgICAgIGlmIChkYXRhLiR0cnVzdGVkKSB7XG4gICAgICAgICAgICBjbGVhcihub2RlcywgY2FjaGVkKTtcbiAgICAgICAgICAgIG5vZGVzID0gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvL2Nvcm5lciBjYXNlOiByZXBsYWNpbmcgdGhlIG5vZGVWYWx1ZSBvZiBhIHRleHQgbm9kZSB0aGF0IGlzIGEgY2hpbGQgb2YgYSB0ZXh0YXJlYS9jb250ZW50ZWRpdGFibGUgZG9lc24ndCB3b3JrXG4gICAgICAgICAgICAvL3dlIG5lZWQgdG8gdXBkYXRlIHRoZSB2YWx1ZSBwcm9wZXJ0eSBvZiB0aGUgcGFyZW50IHRleHRhcmVhIG9yIHRoZSBpbm5lckhUTUwgb2YgdGhlIGNvbnRlbnRlZGl0YWJsZSBlbGVtZW50IGluc3RlYWRcbiAgICAgICAgICAgIGlmIChwYXJlbnRUYWcgPT09IFwidGV4dGFyZWFcIikgcGFyZW50RWxlbWVudC52YWx1ZSA9IGRhdGE7XG4gICAgICAgICAgICBlbHNlIGlmIChlZGl0YWJsZSkgZWRpdGFibGUuaW5uZXJIVE1MID0gZGF0YTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBpZiAobm9kZXNbMF0ubm9kZVR5cGUgPT09IDEgfHwgbm9kZXMubGVuZ3RoID4gMSkgeyAvL3dhcyBhIHRydXN0ZWQgc3RyaW5nXG4gICAgICAgICAgICAgICAgY2xlYXIoY2FjaGVkLm5vZGVzLCBjYWNoZWQpO1xuICAgICAgICAgICAgICAgIG5vZGVzID0gWyRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKV1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2Rlc1swXSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgbm9kZXNbMF0ubm9kZVZhbHVlID0gZGF0YVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcihkYXRhKTtcbiAgICAgICAgY2FjaGVkLm5vZGVzID0gbm9kZXNcbiAgICAgIH1cbiAgICAgIGVsc2UgY2FjaGVkLm5vZGVzLmludGFjdCA9IHRydWVcbiAgICB9XG5cbiAgICByZXR1cm4gY2FjaGVkXG4gIH1cbiAgZnVuY3Rpb24gc29ydENoYW5nZXMoYSwgYikge3JldHVybiBhLmFjdGlvbiAtIGIuYWN0aW9uIHx8IGEuaW5kZXggLSBiLmluZGV4fVxuICBmdW5jdGlvbiBzZXRBdHRyaWJ1dGVzKG5vZGUsIHRhZywgZGF0YUF0dHJzLCBjYWNoZWRBdHRycywgbmFtZXNwYWNlKSB7XG4gICAgZm9yICh2YXIgYXR0ck5hbWUgaW4gZGF0YUF0dHJzKSB7XG4gICAgICB2YXIgZGF0YUF0dHIgPSBkYXRhQXR0cnNbYXR0ck5hbWVdO1xuICAgICAgdmFyIGNhY2hlZEF0dHIgPSBjYWNoZWRBdHRyc1thdHRyTmFtZV07XG4gICAgICBpZiAoIShhdHRyTmFtZSBpbiBjYWNoZWRBdHRycykgfHwgKGNhY2hlZEF0dHIgIT09IGRhdGFBdHRyKSkge1xuICAgICAgICBjYWNoZWRBdHRyc1thdHRyTmFtZV0gPSBkYXRhQXR0cjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvL2Bjb25maWdgIGlzbid0IGEgcmVhbCBhdHRyaWJ1dGVzLCBzbyBpZ25vcmUgaXRcbiAgICAgICAgICBpZiAoYXR0ck5hbWUgPT09IFwiY29uZmlnXCIgfHwgYXR0ck5hbWUgPT0gXCJrZXlcIikgY29udGludWU7XG4gICAgICAgICAgLy9ob29rIGV2ZW50IGhhbmRsZXJzIHRvIHRoZSBhdXRvLXJlZHJhd2luZyBzeXN0ZW1cbiAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZGF0YUF0dHIgPT09IEZVTkNUSU9OICYmIGF0dHJOYW1lLmluZGV4T2YoXCJvblwiKSA9PT0gMCkge1xuICAgICAgICAgICAgbm9kZVthdHRyTmFtZV0gPSBhdXRvcmVkcmF3KGRhdGFBdHRyLCBub2RlKVxuICAgICAgICAgIH1cbiAgICAgICAgICAvL2hhbmRsZSBgc3R5bGU6IHsuLi59YFxuICAgICAgICAgIGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInN0eWxlXCIgJiYgZGF0YUF0dHIgIT0gbnVsbCAmJiB0eXBlLmNhbGwoZGF0YUF0dHIpID09PSBPQkpFQ1QpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHJ1bGUgaW4gZGF0YUF0dHIpIHtcbiAgICAgICAgICAgICAgaWYgKGNhY2hlZEF0dHIgPT0gbnVsbCB8fCBjYWNoZWRBdHRyW3J1bGVdICE9PSBkYXRhQXR0cltydWxlXSkgbm9kZS5zdHlsZVtydWxlXSA9IGRhdGFBdHRyW3J1bGVdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBydWxlIGluIGNhY2hlZEF0dHIpIHtcbiAgICAgICAgICAgICAgaWYgKCEocnVsZSBpbiBkYXRhQXR0cikpIG5vZGUuc3R5bGVbcnVsZV0gPSBcIlwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vaGFuZGxlIFNWR1xuICAgICAgICAgIGVsc2UgaWYgKG5hbWVzcGFjZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoYXR0ck5hbWUgPT09IFwiaHJlZlwiKSBub2RlLnNldEF0dHJpYnV0ZU5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLCBcImhyZWZcIiwgZGF0YUF0dHIpO1xuICAgICAgICAgICAgZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwiY2xhc3NOYW1lXCIpIG5vZGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgZGF0YUF0dHIpO1xuICAgICAgICAgICAgZWxzZSBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGF0YUF0dHIpXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vaGFuZGxlIGNhc2VzIHRoYXQgYXJlIHByb3BlcnRpZXMgKGJ1dCBpZ25vcmUgY2FzZXMgd2hlcmUgd2Ugc2hvdWxkIHVzZSBzZXRBdHRyaWJ1dGUgaW5zdGVhZClcbiAgICAgICAgICAvLy0gbGlzdCBhbmQgZm9ybSBhcmUgdHlwaWNhbGx5IHVzZWQgYXMgc3RyaW5ncywgYnV0IGFyZSBET00gZWxlbWVudCByZWZlcmVuY2VzIGluIGpzXG4gICAgICAgICAgLy8tIHdoZW4gdXNpbmcgQ1NTIHNlbGVjdG9ycyAoZS5nLiBgbShcIltzdHlsZT0nJ11cIilgKSwgc3R5bGUgaXMgdXNlZCBhcyBhIHN0cmluZywgYnV0IGl0J3MgYW4gb2JqZWN0IGluIGpzXG4gICAgICAgICAgZWxzZSBpZiAoYXR0ck5hbWUgaW4gbm9kZSAmJiAhKGF0dHJOYW1lID09PSBcImxpc3RcIiB8fCBhdHRyTmFtZSA9PT0gXCJzdHlsZVwiIHx8IGF0dHJOYW1lID09PSBcImZvcm1cIiB8fCBhdHRyTmFtZSA9PT0gXCJ0eXBlXCIpKSB7XG4gICAgICAgICAgICAvLyMzNDggZG9uJ3Qgc2V0IHRoZSB2YWx1ZSBpZiBub3QgbmVlZGVkIG90aGVyd2lzZSBjdXJzb3IgcGxhY2VtZW50IGJyZWFrcyBpbiBDaHJvbWVcbiAgICAgICAgICAgIGlmICh0YWcgIT09IFwiaW5wdXRcIiB8fCBub2RlW2F0dHJOYW1lXSAhPT0gZGF0YUF0dHIpIG5vZGVbYXR0ck5hbWVdID0gZGF0YUF0dHJcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGF0YUF0dHIpXG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvL3N3YWxsb3cgSUUncyBpbnZhbGlkIGFyZ3VtZW50IGVycm9ycyB0byBtaW1pYyBIVE1MJ3MgZmFsbGJhY2stdG8tZG9pbmctbm90aGluZy1vbi1pbnZhbGlkLWF0dHJpYnV0ZXMgYmVoYXZpb3JcbiAgICAgICAgICBpZiAoZS5tZXNzYWdlLmluZGV4T2YoXCJJbnZhbGlkIGFyZ3VtZW50XCIpIDwgMCkgdGhyb3cgZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyMzNDggZGF0YUF0dHIgbWF5IG5vdCBiZSBhIHN0cmluZywgc28gdXNlIGxvb3NlIGNvbXBhcmlzb24gKGRvdWJsZSBlcXVhbCkgaW5zdGVhZCBvZiBzdHJpY3QgKHRyaXBsZSBlcXVhbClcbiAgICAgIGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInZhbHVlXCIgJiYgdGFnID09PSBcImlucHV0XCIgJiYgbm9kZS52YWx1ZSAhPSBkYXRhQXR0cikge1xuICAgICAgICBub2RlLnZhbHVlID0gZGF0YUF0dHJcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlZEF0dHJzXG4gIH1cbiAgZnVuY3Rpb24gY2xlYXIobm9kZXMsIGNhY2hlZCkge1xuICAgIGZvciAodmFyIGkgPSBub2Rlcy5sZW5ndGggLSAxOyBpID4gLTE7IGktLSkge1xuICAgICAgaWYgKG5vZGVzW2ldICYmIG5vZGVzW2ldLnBhcmVudE5vZGUpIHtcbiAgICAgICAgdHJ5IHtub2Rlc1tpXS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGVzW2ldKX1cbiAgICAgICAgY2F0Y2ggKGUpIHt9IC8vaWdub3JlIGlmIHRoaXMgZmFpbHMgZHVlIHRvIG9yZGVyIG9mIGV2ZW50cyAoc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjE5MjYwODMvZmFpbGVkLXRvLWV4ZWN1dGUtcmVtb3ZlY2hpbGQtb24tbm9kZSlcbiAgICAgICAgY2FjaGVkID0gW10uY29uY2F0KGNhY2hlZCk7XG4gICAgICAgIGlmIChjYWNoZWRbaV0pIHVubG9hZChjYWNoZWRbaV0pXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChub2Rlcy5sZW5ndGggIT0gMCkgbm9kZXMubGVuZ3RoID0gMFxuICB9XG4gIGZ1bmN0aW9uIHVubG9hZChjYWNoZWQpIHtcbiAgICBpZiAoY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgdHlwZW9mIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID09PSBGVU5DVElPTikgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQoKTtcbiAgICBpZiAoY2FjaGVkLmNoaWxkcmVuKSB7XG4gICAgICBpZiAodHlwZS5jYWxsKGNhY2hlZC5jaGlsZHJlbikgPT09IEFSUkFZKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBjaGlsZDsgY2hpbGQgPSBjYWNoZWQuY2hpbGRyZW5baV07IGkrKykgdW5sb2FkKGNoaWxkKVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoY2FjaGVkLmNoaWxkcmVuLnRhZykgdW5sb2FkKGNhY2hlZC5jaGlsZHJlbilcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSkge1xuICAgIHZhciBuZXh0U2libGluZyA9IHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF07XG4gICAgaWYgKG5leHRTaWJsaW5nKSB7XG4gICAgICB2YXIgaXNFbGVtZW50ID0gbmV4dFNpYmxpbmcubm9kZVR5cGUgIT0gMTtcbiAgICAgIHZhciBwbGFjZWhvbGRlciA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIGlmIChpc0VsZW1lbnQpIHtcbiAgICAgICAgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIG5leHRTaWJsaW5nIHx8IG51bGwpO1xuICAgICAgICBwbGFjZWhvbGRlci5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmViZWdpblwiLCBkYXRhKTtcbiAgICAgICAgcGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChwbGFjZWhvbGRlcilcbiAgICAgIH1cbiAgICAgIGVsc2UgbmV4dFNpYmxpbmcuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlYmVnaW5cIiwgZGF0YSlcbiAgICB9XG4gICAgZWxzZSBwYXJlbnRFbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWVuZFwiLCBkYXRhKTtcbiAgICB2YXIgbm9kZXMgPSBbXTtcbiAgICB3aGlsZSAocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSAhPT0gbmV4dFNpYmxpbmcpIHtcbiAgICAgIG5vZGVzLnB1c2gocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSk7XG4gICAgICBpbmRleCsrXG4gICAgfVxuICAgIHJldHVybiBub2Rlc1xuICB9XG4gIGZ1bmN0aW9uIGF1dG9yZWRyYXcoY2FsbGJhY2ssIG9iamVjdCkge1xuICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICBlID0gZSB8fCBldmVudDtcbiAgICAgIG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKTtcbiAgICAgIG0uc3RhcnRDb21wdXRhdGlvbigpO1xuICAgICAgdHJ5IHtyZXR1cm4gY2FsbGJhY2suY2FsbChvYmplY3QsIGUpfVxuICAgICAgZmluYWxseSB7XG4gICAgICAgIGVuZEZpcnN0Q29tcHV0YXRpb24oKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHZhciBodG1sO1xuICB2YXIgZG9jdW1lbnROb2RlID0ge1xuICAgIGFwcGVuZENoaWxkOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICBpZiAoaHRtbCA9PT0gdW5kZWZpbmVkKSBodG1sID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJodG1sXCIpO1xuICAgICAgaWYgKCRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAhPT0gbm9kZSkge1xuICAgICAgICAkZG9jdW1lbnQucmVwbGFjZUNoaWxkKG5vZGUsICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpXG4gICAgICB9XG4gICAgICBlbHNlICRkb2N1bWVudC5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgIHRoaXMuY2hpbGROb2RlcyA9ICRkb2N1bWVudC5jaGlsZE5vZGVzXG4gICAgfSxcbiAgICBpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHRoaXMuYXBwZW5kQ2hpbGQobm9kZSlcbiAgICB9LFxuICAgIGNoaWxkTm9kZXM6IFtdXG4gIH07XG4gIHZhciBub2RlQ2FjaGUgPSBbXSwgY2VsbENhY2hlID0ge307XG4gIG0ucmVuZGVyID0gZnVuY3Rpb24ocm9vdCwgY2VsbCwgZm9yY2VSZWNyZWF0aW9uKSB7XG4gICAgdmFyIGNvbmZpZ3MgPSBbXTtcbiAgICBpZiAoIXJvb3QpIHRocm93IG5ldyBFcnJvcihcIlBsZWFzZSBlbnN1cmUgdGhlIERPTSBlbGVtZW50IGV4aXN0cyBiZWZvcmUgcmVuZGVyaW5nIGEgdGVtcGxhdGUgaW50byBpdC5cIik7XG4gICAgdmFyIGlkID0gZ2V0Q2VsbENhY2hlS2V5KHJvb3QpO1xuICAgIHZhciBpc0RvY3VtZW50Um9vdCA9IHJvb3QgPT09ICRkb2N1bWVudDtcbiAgICB2YXIgbm9kZSA9IGlzRG9jdW1lbnRSb290IHx8IHJvb3QgPT09ICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgPyBkb2N1bWVudE5vZGUgOiByb290O1xuICAgIGlmIChpc0RvY3VtZW50Um9vdCAmJiBjZWxsLnRhZyAhPSBcImh0bWxcIikgY2VsbCA9IHt0YWc6IFwiaHRtbFwiLCBhdHRyczoge30sIGNoaWxkcmVuOiBjZWxsfTtcbiAgICBpZiAoY2VsbENhY2hlW2lkXSA9PT0gdW5kZWZpbmVkKSBjbGVhcihub2RlLmNoaWxkTm9kZXMpO1xuICAgIGlmIChmb3JjZVJlY3JlYXRpb24gPT09IHRydWUpIHJlc2V0KHJvb3QpO1xuICAgIGNlbGxDYWNoZVtpZF0gPSBidWlsZChub2RlLCBudWxsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY2VsbCwgY2VsbENhY2hlW2lkXSwgZmFsc2UsIDAsIG51bGwsIHVuZGVmaW5lZCwgY29uZmlncyk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbmZpZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIGNvbmZpZ3NbaV0oKVxuICB9O1xuICBmdW5jdGlvbiBnZXRDZWxsQ2FjaGVLZXkoZWxlbWVudCkge1xuICAgIHZhciBpbmRleCA9IG5vZGVDYWNoZS5pbmRleE9mKGVsZW1lbnQpO1xuICAgIHJldHVybiBpbmRleCA8IDAgPyBub2RlQ2FjaGUucHVzaChlbGVtZW50KSAtIDEgOiBpbmRleFxuICB9XG5cbiAgbS50cnVzdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFsdWUgPSBuZXcgU3RyaW5nKHZhbHVlKTtcbiAgICB2YWx1ZS4kdHJ1c3RlZCA9IHRydWU7XG4gICAgcmV0dXJuIHZhbHVlXG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0dGVyc2V0dGVyKHN0b3JlKSB7XG4gICAgdmFyIHByb3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSBzdG9yZSA9IGFyZ3VtZW50c1swXTtcbiAgICAgIHJldHVybiBzdG9yZVxuICAgIH07XG5cbiAgICBwcm9wLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHN0b3JlXG4gICAgfTtcblxuICAgIHJldHVybiBwcm9wXG4gIH1cblxuICBtLnByb3AgPSBmdW5jdGlvbiAoc3RvcmUpIHtcbiAgICAvL25vdGU6IHVzaW5nIG5vbi1zdHJpY3QgZXF1YWxpdHkgY2hlY2sgaGVyZSBiZWNhdXNlIHdlJ3JlIGNoZWNraW5nIGlmIHN0b3JlIGlzIG51bGwgT1IgdW5kZWZpbmVkXG4gICAgaWYgKCgoc3RvcmUgIT0gbnVsbCAmJiB0eXBlLmNhbGwoc3RvcmUpID09PSBPQkpFQ1QpIHx8IHR5cGVvZiBzdG9yZSA9PT0gRlVOQ1RJT04pICYmIHR5cGVvZiBzdG9yZS50aGVuID09PSBGVU5DVElPTikge1xuICAgICAgcmV0dXJuIHByb3BpZnkoc3RvcmUpXG4gICAgfVxuXG4gICAgcmV0dXJuIGdldHRlcnNldHRlcihzdG9yZSlcbiAgfTtcblxuICB2YXIgcm9vdHMgPSBbXSwgbW9kdWxlcyA9IFtdLCBjb250cm9sbGVycyA9IFtdLCBsYXN0UmVkcmF3SWQgPSBudWxsLCBsYXN0UmVkcmF3Q2FsbFRpbWUgPSAwLCBjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsLCBwcmV2ZW50ZWQgPSBmYWxzZSwgdG9wTW9kdWxlO1xuICB2YXIgRlJBTUVfQlVER0VUID0gMTY7IC8vNjAgZnJhbWVzIHBlciBzZWNvbmQgPSAxIGNhbGwgcGVyIDE2IG1zXG4gIG0ubW9kdWxlID0gZnVuY3Rpb24ocm9vdCwgbW9kdWxlKSB7XG4gICAgaWYgKCFyb290KSB0aHJvdyBuZXcgRXJyb3IoXCJQbGVhc2UgZW5zdXJlIHRoZSBET00gZWxlbWVudCBleGlzdHMgYmVmb3JlIHJlbmRlcmluZyBhIHRlbXBsYXRlIGludG8gaXQuXCIpO1xuICAgIHZhciBpbmRleCA9IHJvb3RzLmluZGV4T2Yocm9vdCk7XG4gICAgaWYgKGluZGV4IDwgMCkgaW5kZXggPSByb290cy5sZW5ndGg7XG4gICAgdmFyIGlzUHJldmVudGVkID0gZmFsc2U7XG4gICAgaWYgKGNvbnRyb2xsZXJzW2luZGV4XSAmJiB0eXBlb2YgY29udHJvbGxlcnNbaW5kZXhdLm9udW5sb2FkID09PSBGVU5DVElPTikge1xuICAgICAgdmFyIGV2ZW50ID0ge1xuICAgICAgICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oKSB7aXNQcmV2ZW50ZWQgPSB0cnVlfVxuICAgICAgfTtcbiAgICAgIGNvbnRyb2xsZXJzW2luZGV4XS5vbnVubG9hZChldmVudClcbiAgICB9XG4gICAgaWYgKCFpc1ByZXZlbnRlZCkge1xuICAgICAgbS5yZWRyYXcuc3RyYXRlZ3koXCJhbGxcIik7XG4gICAgICBtLnN0YXJ0Q29tcHV0YXRpb24oKTtcbiAgICAgIHJvb3RzW2luZGV4XSA9IHJvb3Q7XG4gICAgICB2YXIgY3VycmVudE1vZHVsZSA9IHRvcE1vZHVsZSA9IG1vZHVsZTtcbiAgICAgIHZhciBjb250cm9sbGVyID0gbmV3IG1vZHVsZS5jb250cm9sbGVyO1xuICAgICAgLy9jb250cm9sbGVycyBtYXkgY2FsbCBtLm1vZHVsZSByZWN1cnNpdmVseSAodmlhIG0ucm91dGUgcmVkaXJlY3RzLCBmb3IgZXhhbXBsZSlcbiAgICAgIC8vdGhpcyBjb25kaXRpb25hbCBlbnN1cmVzIG9ubHkgdGhlIGxhc3QgcmVjdXJzaXZlIG0ubW9kdWxlIGNhbGwgaXMgYXBwbGllZFxuICAgICAgaWYgKGN1cnJlbnRNb2R1bGUgPT09IHRvcE1vZHVsZSkge1xuICAgICAgICBjb250cm9sbGVyc1tpbmRleF0gPSBjb250cm9sbGVyO1xuICAgICAgICBtb2R1bGVzW2luZGV4XSA9IG1vZHVsZVxuICAgICAgfVxuICAgICAgZW5kRmlyc3RDb21wdXRhdGlvbigpO1xuICAgICAgcmV0dXJuIGNvbnRyb2xsZXJzW2luZGV4XVxuICAgIH1cbiAgfTtcbiAgbS5yZWRyYXcgPSBmdW5jdGlvbihmb3JjZSkge1xuICAgIC8vbGFzdFJlZHJhd0lkIGlzIGEgcG9zaXRpdmUgbnVtYmVyIGlmIGEgc2Vjb25kIHJlZHJhdyBpcyByZXF1ZXN0ZWQgYmVmb3JlIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxuICAgIC8vbGFzdFJlZHJhd0lEIGlzIG51bGwgaWYgaXQncyB0aGUgZmlyc3QgcmVkcmF3IGFuZCBub3QgYW4gZXZlbnQgaGFuZGxlclxuICAgIGlmIChsYXN0UmVkcmF3SWQgJiYgZm9yY2UgIT09IHRydWUpIHtcbiAgICAgIC8vd2hlbiBzZXRUaW1lb3V0OiBvbmx5IHJlc2NoZWR1bGUgcmVkcmF3IGlmIHRpbWUgYmV0d2VlbiBub3cgYW5kIHByZXZpb3VzIHJlZHJhdyBpcyBiaWdnZXIgdGhhbiBhIGZyYW1lLCBvdGhlcndpc2Uga2VlcCBjdXJyZW50bHkgc2NoZWR1bGVkIHRpbWVvdXRcbiAgICAgIC8vd2hlbiByQUY6IGFsd2F5cyByZXNjaGVkdWxlIHJlZHJhd1xuICAgICAgaWYgKG5ldyBEYXRlIC0gbGFzdFJlZHJhd0NhbGxUaW1lID4gRlJBTUVfQlVER0VUIHx8ICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICAgICAgaWYgKGxhc3RSZWRyYXdJZCA+IDApICRjYW5jZWxBbmltYXRpb25GcmFtZShsYXN0UmVkcmF3SWQpO1xuICAgICAgICBsYXN0UmVkcmF3SWQgPSAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlZHJhdywgRlJBTUVfQlVER0VUKVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJlZHJhdygpO1xuICAgICAgbGFzdFJlZHJhd0lkID0gJHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtsYXN0UmVkcmF3SWQgPSBudWxsfSwgRlJBTUVfQlVER0VUKVxuICAgIH1cbiAgfTtcbiAgbS5yZWRyYXcuc3RyYXRlZ3kgPSBtLnByb3AoKTtcbiAgZnVuY3Rpb24gcmVkcmF3KCkge1xuICAgIHZhciBmb3JjZVJlZHJhdyA9IG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT09IFwiYWxsXCI7XG4gICAgZm9yICh2YXIgaSA9IDAsIHJvb3Q7IHJvb3QgPSByb290c1tpXTsgaSsrKSB7XG4gICAgICBpZiAoY29udHJvbGxlcnNbaV0pIHtcbiAgICAgICAgbS5yZW5kZXIocm9vdCwgbW9kdWxlc1tpXS52aWV3KGNvbnRyb2xsZXJzW2ldKSwgZm9yY2VSZWRyYXcpXG4gICAgICB9XG4gICAgfVxuICAgIC8vYWZ0ZXIgcmVuZGVyaW5nIHdpdGhpbiBhIHJvdXRlZCBjb250ZXh0LCB3ZSBuZWVkIHRvIHNjcm9sbCBiYWNrIHRvIHRoZSB0b3AsIGFuZCBmZXRjaCB0aGUgZG9jdW1lbnQgdGl0bGUgZm9yIGhpc3RvcnkucHVzaFN0YXRlXG4gICAgaWYgKGNvbXB1dGVQb3N0UmVkcmF3SG9vaykge1xuICAgICAgY29tcHV0ZVBvc3RSZWRyYXdIb29rKCk7XG4gICAgICBjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsXG4gICAgfVxuICAgIGxhc3RSZWRyYXdJZCA9IG51bGw7XG4gICAgbGFzdFJlZHJhd0NhbGxUaW1lID0gbmV3IERhdGU7XG4gICAgbS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXG4gIH1cblxuICB2YXIgcGVuZGluZ1JlcXVlc3RzID0gMDtcbiAgbS5zdGFydENvbXB1dGF0aW9uID0gZnVuY3Rpb24oKSB7cGVuZGluZ1JlcXVlc3RzKyt9O1xuICBtLmVuZENvbXB1dGF0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcGVuZGluZ1JlcXVlc3RzID0gTWF0aC5tYXgocGVuZGluZ1JlcXVlc3RzIC0gMSwgMCk7XG4gICAgaWYgKHBlbmRpbmdSZXF1ZXN0cyA9PT0gMCkgbS5yZWRyYXcoKVxuICB9O1xuICB2YXIgZW5kRmlyc3RDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChtLnJlZHJhdy5zdHJhdGVneSgpID09IFwibm9uZVwiKSB7XG4gICAgICBwZW5kaW5nUmVxdWVzdHMtLVxuICAgICAgbS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXG4gICAgfVxuICAgIGVsc2UgbS5lbmRDb21wdXRhdGlvbigpO1xuICB9XG5cbiAgbS53aXRoQXR0ciA9IGZ1bmN0aW9uKHByb3AsIHdpdGhBdHRyQ2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgZSA9IGUgfHwgZXZlbnQ7XG4gICAgICB2YXIgY3VycmVudFRhcmdldCA9IGUuY3VycmVudFRhcmdldCB8fCB0aGlzO1xuICAgICAgd2l0aEF0dHJDYWxsYmFjayhwcm9wIGluIGN1cnJlbnRUYXJnZXQgPyBjdXJyZW50VGFyZ2V0W3Byb3BdIDogY3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUocHJvcCkpXG4gICAgfVxuICB9O1xuXG4gIC8vcm91dGluZ1xuICB2YXIgbW9kZXMgPSB7cGF0aG5hbWU6IFwiXCIsIGhhc2g6IFwiI1wiLCBzZWFyY2g6IFwiP1wifTtcbiAgdmFyIHJlZGlyZWN0ID0gZnVuY3Rpb24oKSB7fSwgcm91dGVQYXJhbXMsIGN1cnJlbnRSb3V0ZTtcbiAgbS5yb3V0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vbS5yb3V0ZSgpXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiBjdXJyZW50Um91dGU7XG4gICAgLy9tLnJvdXRlKGVsLCBkZWZhdWx0Um91dGUsIHJvdXRlcylcbiAgICBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzICYmIHR5cGUuY2FsbChhcmd1bWVudHNbMV0pID09PSBTVFJJTkcpIHtcbiAgICAgIHZhciByb290ID0gYXJndW1lbnRzWzBdLCBkZWZhdWx0Um91dGUgPSBhcmd1bWVudHNbMV0sIHJvdXRlciA9IGFyZ3VtZW50c1syXTtcbiAgICAgIHJlZGlyZWN0ID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgIHZhciBwYXRoID0gY3VycmVudFJvdXRlID0gbm9ybWFsaXplUm91dGUoc291cmNlKTtcbiAgICAgICAgaWYgKCFyb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSkge1xuICAgICAgICAgIG0ucm91dGUoZGVmYXVsdFJvdXRlLCB0cnVlKVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdmFyIGxpc3RlbmVyID0gbS5yb3V0ZS5tb2RlID09PSBcImhhc2hcIiA/IFwib25oYXNoY2hhbmdlXCIgOiBcIm9ucG9wc3RhdGVcIjtcbiAgICAgIHdpbmRvd1tsaXN0ZW5lcl0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRSb3V0ZSAhPSBub3JtYWxpemVSb3V0ZSgkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXSkpIHtcbiAgICAgICAgICByZWRpcmVjdCgkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXSlcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IHNldFNjcm9sbDtcbiAgICAgIHdpbmRvd1tsaXN0ZW5lcl0oKVxuICAgIH1cbiAgICAvL2NvbmZpZzogbS5yb3V0ZVxuICAgIGVsc2UgaWYgKGFyZ3VtZW50c1swXS5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IGFyZ3VtZW50c1swXTtcbiAgICAgIHZhciBpc0luaXRpYWxpemVkID0gYXJndW1lbnRzWzFdO1xuICAgICAgdmFyIGNvbnRleHQgPSBhcmd1bWVudHNbMl07XG4gICAgICBlbGVtZW50LmhyZWYgPSAobS5yb3V0ZS5tb2RlICE9PSAncGF0aG5hbWUnID8gJGxvY2F0aW9uLnBhdGhuYW1lIDogJycpICsgbW9kZXNbbS5yb3V0ZS5tb2RlXSArIHRoaXMuYXR0cnMuaHJlZjtcbiAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpO1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcbiAgICB9XG4gICAgLy9tLnJvdXRlKHJvdXRlLCBwYXJhbXMpXG4gICAgZWxzZSBpZiAodHlwZS5jYWxsKGFyZ3VtZW50c1swXSkgPT09IFNUUklORykge1xuICAgICAgY3VycmVudFJvdXRlID0gYXJndW1lbnRzWzBdO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHNbMV0gfHwge31cbiAgICAgIHZhciBxdWVyeUluZGV4ID0gY3VycmVudFJvdXRlLmluZGV4T2YoXCI/XCIpXG4gICAgICB2YXIgcGFyYW1zID0gcXVlcnlJbmRleCA+IC0xID8gcGFyc2VRdWVyeVN0cmluZyhjdXJyZW50Um91dGUuc2xpY2UocXVlcnlJbmRleCArIDEpKSA6IHt9XG4gICAgICBmb3IgKHZhciBpIGluIGFyZ3MpIHBhcmFtc1tpXSA9IGFyZ3NbaV1cbiAgICAgIHZhciBxdWVyeXN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmcocGFyYW1zKVxuICAgICAgdmFyIGN1cnJlbnRQYXRoID0gcXVlcnlJbmRleCA+IC0xID8gY3VycmVudFJvdXRlLnNsaWNlKDAsIHF1ZXJ5SW5kZXgpIDogY3VycmVudFJvdXRlXG4gICAgICBpZiAocXVlcnlzdHJpbmcpIGN1cnJlbnRSb3V0ZSA9IGN1cnJlbnRQYXRoICsgKGN1cnJlbnRQYXRoLmluZGV4T2YoXCI/XCIpID09PSAtMSA/IFwiP1wiIDogXCImXCIpICsgcXVlcnlzdHJpbmc7XG5cbiAgICAgIHZhciBzaG91bGRSZXBsYWNlSGlzdG9yeUVudHJ5ID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgPyBhcmd1bWVudHNbMl0gOiBhcmd1bWVudHNbMV0pID09PSB0cnVlO1xuXG4gICAgICBpZiAod2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKSB7XG4gICAgICAgIGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHdpbmRvdy5oaXN0b3J5W3Nob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkgPyBcInJlcGxhY2VTdGF0ZVwiIDogXCJwdXNoU3RhdGVcIl0obnVsbCwgJGRvY3VtZW50LnRpdGxlLCBtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKTtcbiAgICAgICAgICBzZXRTY3JvbGwoKVxuICAgICAgICB9O1xuICAgICAgICByZWRpcmVjdChtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKVxuICAgICAgfVxuICAgICAgZWxzZSAkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXSA9IGN1cnJlbnRSb3V0ZVxuICAgIH1cbiAgfTtcbiAgbS5yb3V0ZS5wYXJhbSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICghcm91dGVQYXJhbXMpIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IGNhbGwgbS5yb3V0ZShlbGVtZW50LCBkZWZhdWx0Um91dGUsIHJvdXRlcykgYmVmb3JlIGNhbGxpbmcgbS5yb3V0ZS5wYXJhbSgpXCIpXG4gICAgcmV0dXJuIHJvdXRlUGFyYW1zW2tleV1cbiAgfTtcbiAgbS5yb3V0ZS5tb2RlID0gXCJzZWFyY2hcIjtcbiAgbS5yb3V0ZS5wcmV2aW91cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcmV2aW91cztcblxuICAgIHZhciByb3V0ZSA9IG0ucm91dGUoKSB8fCAnLyc7XG4gICAgaWYgKHJvdXRlLmxlbmd0aCA+PSAxKSB7XG4gICAgICB2YXIgYXJyID0gcm91dGUuc3BsaXQoJy8nKTtcblxuICAgICAgYXJyLnBvcCgpO1xuXG4gICAgICBwcmV2aW91cyA9IGFyci5qb2luKCcvJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcHJldmlvdXMgPSAnLyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpb3VzO1xuICB9O1xuXG4gIG0ucm91dGUuYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIG0ucm91dGUobS5yb3V0ZS5wcmV2aW91cygpKTtcbiAgfTtcbiAgZnVuY3Rpb24gbm9ybWFsaXplUm91dGUocm91dGUpIHtyZXR1cm4gcm91dGUuc2xpY2UobW9kZXNbbS5yb3V0ZS5tb2RlXS5sZW5ndGgpfVxuICBmdW5jdGlvbiByb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSB7XG4gICAgcm91dGVQYXJhbXMgPSB7fTtcblxuICAgIHZhciBxdWVyeVN0YXJ0ID0gcGF0aC5pbmRleE9mKFwiP1wiKTtcbiAgICBpZiAocXVlcnlTdGFydCAhPT0gLTEpIHtcbiAgICAgIHJvdXRlUGFyYW1zID0gcGFyc2VRdWVyeVN0cmluZyhwYXRoLnN1YnN0cihxdWVyeVN0YXJ0ICsgMSwgcGF0aC5sZW5ndGgpKTtcbiAgICAgIHBhdGggPSBwYXRoLnN1YnN0cigwLCBxdWVyeVN0YXJ0KVxuICAgIH1cblxuICAgIGZvciAodmFyIHJvdXRlIGluIHJvdXRlcikge1xuICAgICAgaWYgKHJvdXRlID09PSBwYXRoKSB7XG4gICAgICAgIG0ubW9kdWxlKHJvb3QsIHJvdXRlcltyb3V0ZV0pO1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuXG4gICAgICB2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoXCJeXCIgKyByb3V0ZS5yZXBsYWNlKC86W15cXC9dKz9cXC57M30vZywgXCIoLio/KVwiKS5yZXBsYWNlKC86W15cXC9dKy9nLCBcIihbXlxcXFwvXSspXCIpICsgXCJcXC8/JFwiKTtcblxuICAgICAgaWYgKG1hdGNoZXIudGVzdChwYXRoKSkge1xuICAgICAgICBwYXRoLnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGtleXMgPSByb3V0ZS5tYXRjaCgvOlteXFwvXSsvZykgfHwgW107XG4gICAgICAgICAgdmFyIHZhbHVlcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxLCAtMik7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHJvdXRlUGFyYW1zW2tleXNbaV0ucmVwbGFjZSgvOnxcXC4vZywgXCJcIildID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlc1tpXSlcbiAgICAgICAgICBtLm1vZHVsZShyb290LCByb3V0ZXJbcm91dGVdKVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcm91dGVVbm9idHJ1c2l2ZShlKSB7XG4gICAgZSA9IGUgfHwgZXZlbnQ7XG4gICAgaWYgKGUuY3RybEtleSB8fCBlLm1ldGFLZXkgfHwgZS53aGljaCA9PT0gMikgcmV0dXJuO1xuICAgIGlmIChlLnByZXZlbnREZWZhdWx0KSBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZWxzZSBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgdmFyIGN1cnJlbnRUYXJnZXQgPSBlLmN1cnJlbnRUYXJnZXQgfHwgdGhpcztcbiAgICB2YXIgYXJncyA9IG0ucm91dGUubW9kZSA9PT0gXCJwYXRobmFtZVwiICYmIGN1cnJlbnRUYXJnZXQuc2VhcmNoID8gcGFyc2VRdWVyeVN0cmluZyhjdXJyZW50VGFyZ2V0LnNlYXJjaC5zbGljZSgxKSkgOiB7fTtcbiAgICBtLnJvdXRlKGN1cnJlbnRUYXJnZXRbbS5yb3V0ZS5tb2RlXS5zbGljZShtb2Rlc1ttLnJvdXRlLm1vZGVdLmxlbmd0aCksIGFyZ3MpXG4gIH1cbiAgZnVuY3Rpb24gc2V0U2Nyb2xsKCkge1xuICAgIGlmIChtLnJvdXRlLm1vZGUgIT0gXCJoYXNoXCIgJiYgJGxvY2F0aW9uLmhhc2gpICRsb2NhdGlvbi5oYXNoID0gJGxvY2F0aW9uLmhhc2g7XG4gICAgZWxzZSB3aW5kb3cuc2Nyb2xsVG8oMCwgMClcbiAgfVxuICBmdW5jdGlvbiBidWlsZFF1ZXJ5U3RyaW5nKG9iamVjdCwgcHJlZml4KSB7XG4gICAgdmFyIHN0ciA9IFtdO1xuICAgIGZvcih2YXIgcHJvcCBpbiBvYmplY3QpIHtcbiAgICAgIHZhciBrZXkgPSBwcmVmaXggPyBwcmVmaXggKyBcIltcIiArIHByb3AgKyBcIl1cIiA6IHByb3AsIHZhbHVlID0gb2JqZWN0W3Byb3BdO1xuICAgICAgc3RyLnB1c2godmFsdWUgIT0gbnVsbCAmJiB0eXBlLmNhbGwodmFsdWUpID09PSBPQkpFQ1QgPyBidWlsZFF1ZXJ5U3RyaW5nKHZhbHVlLCBrZXkpIDogZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpXG4gICAgfVxuICAgIHJldHVybiBzdHIuam9pbihcIiZcIilcbiAgfVxuICBmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nKHN0cikge1xuICAgIHZhciBwYWlycyA9IHN0ci5zcGxpdChcIiZcIiksIHBhcmFtcyA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwYWlycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIHBhaXIgPSBwYWlyc1tpXS5zcGxpdChcIj1cIik7XG4gICAgICBwYXJhbXNbZGVjb2RlU3BhY2UocGFpclswXSldID0gcGFpclsxXSA/IGRlY29kZVNwYWNlKHBhaXJbMV0pIDogXCJcIlxuICAgIH1cbiAgICByZXR1cm4gcGFyYW1zXG4gIH1cbiAgZnVuY3Rpb24gZGVjb2RlU3BhY2Uoc3RyaW5nKSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHJpbmcucmVwbGFjZSgvXFwrL2csIFwiIFwiKSlcbiAgfVxuICBmdW5jdGlvbiByZXNldChyb290KSB7XG4gICAgdmFyIGNhY2hlS2V5ID0gZ2V0Q2VsbENhY2hlS2V5KHJvb3QpO1xuICAgIGNsZWFyKHJvb3QuY2hpbGROb2RlcywgY2VsbENhY2hlW2NhY2hlS2V5XSk7XG4gICAgY2VsbENhY2hlW2NhY2hlS2V5XSA9IHVuZGVmaW5lZFxuICB9XG5cbiAgbS5kZWZlcnJlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcbiAgICBkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlKTtcbiAgICByZXR1cm4gZGVmZXJyZWRcbiAgfTtcbiAgZnVuY3Rpb24gcHJvcGlmeShwcm9taXNlKSB7XG4gICAgdmFyIHByb3AgPSBtLnByb3AoKTtcbiAgICBwcm9taXNlLnRoZW4ocHJvcCk7XG4gICAgcHJvcC50aGVuID0gZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXR1cm4gcHJvcGlmeShwcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KSlcbiAgICB9O1xuICAgIHJldHVybiBwcm9wXG4gIH1cbiAgLy9Qcm9taXoubWl0aHJpbC5qcyB8IFpvbG1laXN0ZXIgfCBNSVRcbiAgLy9hIG1vZGlmaWVkIHZlcnNpb24gb2YgUHJvbWl6LmpzLCB3aGljaCBkb2VzIG5vdCBjb25mb3JtIHRvIFByb21pc2VzL0ErIGZvciB0d28gcmVhc29uczpcbiAgLy8xKSBgdGhlbmAgY2FsbGJhY2tzIGFyZSBjYWxsZWQgc3luY2hyb25vdXNseSAoYmVjYXVzZSBzZXRUaW1lb3V0IGlzIHRvbyBzbG93LCBhbmQgdGhlIHNldEltbWVkaWF0ZSBwb2x5ZmlsbCBpcyB0b28gYmlnXG4gIC8vMikgdGhyb3dpbmcgc3ViY2xhc3NlcyBvZiBFcnJvciBjYXVzZSB0aGUgZXJyb3IgdG8gYmUgYnViYmxlZCB1cCBpbnN0ZWFkIG9mIHRyaWdnZXJpbmcgcmVqZWN0aW9uIChiZWNhdXNlIHRoZSBzcGVjIGRvZXMgbm90IGFjY291bnQgZm9yIHRoZSBpbXBvcnRhbnQgdXNlIGNhc2Ugb2YgZGVmYXVsdCBicm93c2VyIGVycm9yIGhhbmRsaW5nLCBpLmUuIG1lc3NhZ2Ugdy8gbGluZSBudW1iZXIpXG4gIGZ1bmN0aW9uIERlZmVycmVkKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKSB7XG4gICAgdmFyIFJFU09MVklORyA9IDEsIFJFSkVDVElORyA9IDIsIFJFU09MVkVEID0gMywgUkVKRUNURUQgPSA0O1xuICAgIHZhciBzZWxmID0gdGhpcywgc3RhdGUgPSAwLCBwcm9taXNlVmFsdWUgPSAwLCBuZXh0ID0gW107XG5cbiAgICBzZWxmW1wicHJvbWlzZVwiXSA9IHt9O1xuXG4gICAgc2VsZltcInJlc29sdmVcIl0gPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKCFzdGF0ZSkge1xuICAgICAgICBwcm9taXNlVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgc3RhdGUgPSBSRVNPTFZJTkc7XG5cbiAgICAgICAgZmlyZSgpXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH07XG5cbiAgICBzZWxmW1wicmVqZWN0XCJdID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmICghc3RhdGUpIHtcbiAgICAgICAgcHJvbWlzZVZhbHVlID0gdmFsdWU7XG4gICAgICAgIHN0YXRlID0gUkVKRUNUSU5HO1xuXG4gICAgICAgIGZpcmUoKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9O1xuXG4gICAgc2VsZi5wcm9taXNlW1widGhlblwiXSA9IGZ1bmN0aW9uKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spO1xuICAgICAgaWYgKHN0YXRlID09PSBSRVNPTFZFRCkge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VWYWx1ZSlcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHN0YXRlID09PSBSRUpFQ1RFRCkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIG5leHQucHVzaChkZWZlcnJlZClcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGZpbmlzaCh0eXBlKSB7XG4gICAgICBzdGF0ZSA9IHR5cGUgfHwgUkVKRUNURUQ7XG4gICAgICBuZXh0Lm1hcChmdW5jdGlvbihkZWZlcnJlZCkge1xuICAgICAgICBzdGF0ZSA9PT0gUkVTT0xWRUQgJiYgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlVmFsdWUpIHx8IGRlZmVycmVkLnJlamVjdChwcm9taXNlVmFsdWUpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRoZW5uYWJsZSh0aGVuLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaywgbm90VGhlbm5hYmxlQ2FsbGJhY2spIHtcbiAgICAgIGlmICgoKHByb21pc2VWYWx1ZSAhPSBudWxsICYmIHR5cGUuY2FsbChwcm9taXNlVmFsdWUpID09PSBPQkpFQ1QpIHx8IHR5cGVvZiBwcm9taXNlVmFsdWUgPT09IEZVTkNUSU9OKSAmJiB0eXBlb2YgdGhlbiA9PT0gRlVOQ1RJT04pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBjb3VudCBwcm90ZWN0cyBhZ2FpbnN0IGFidXNlIGNhbGxzIGZyb20gc3BlYyBjaGVja2VyXG4gICAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgICB0aGVuLmNhbGwocHJvbWlzZVZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGNvdW50KyspIHJldHVybjtcbiAgICAgICAgICAgIHByb21pc2VWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKClcbiAgICAgICAgICB9LCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChjb3VudCsrKSByZXR1cm47XG4gICAgICAgICAgICBwcm9taXNlVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIGZhaWx1cmVDYWxsYmFjaygpXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgIG0uZGVmZXJyZWQub25lcnJvcihlKTtcbiAgICAgICAgICBwcm9taXNlVmFsdWUgPSBlO1xuICAgICAgICAgIGZhaWx1cmVDYWxsYmFjaygpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vdFRoZW5uYWJsZUNhbGxiYWNrKClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaXJlKCkge1xuICAgICAgLy8gY2hlY2sgaWYgaXQncyBhIHRoZW5hYmxlXG4gICAgICB2YXIgdGhlbjtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoZW4gPSBwcm9taXNlVmFsdWUgJiYgcHJvbWlzZVZhbHVlLnRoZW5cbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIG0uZGVmZXJyZWQub25lcnJvcihlKTtcbiAgICAgICAgcHJvbWlzZVZhbHVlID0gZTtcbiAgICAgICAgc3RhdGUgPSBSRUpFQ1RJTkc7XG4gICAgICAgIHJldHVybiBmaXJlKClcbiAgICAgIH1cbiAgICAgIHRoZW5uYWJsZSh0aGVuLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc3RhdGUgPSBSRVNPTFZJTkc7XG4gICAgICAgIGZpcmUoKVxuICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHN0YXRlID0gUkVKRUNUSU5HO1xuICAgICAgICBmaXJlKClcbiAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIHR5cGVvZiBzdWNjZXNzQ2FsbGJhY2sgPT09IEZVTkNUSU9OKSB7XG4gICAgICAgICAgICBwcm9taXNlVmFsdWUgPSBzdWNjZXNzQ2FsbGJhY2socHJvbWlzZVZhbHVlKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNUSU5HICYmIHR5cGVvZiBmYWlsdXJlQ2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcHJvbWlzZVZhbHVlID0gZmFpbHVyZUNhbGxiYWNrKHByb21pc2VWYWx1ZSk7XG4gICAgICAgICAgICBzdGF0ZSA9IFJFU09MVklOR1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgIG0uZGVmZXJyZWQub25lcnJvcihlKTtcbiAgICAgICAgICBwcm9taXNlVmFsdWUgPSBlO1xuICAgICAgICAgIHJldHVybiBmaW5pc2goKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb21pc2VWYWx1ZSA9PT0gc2VsZikge1xuICAgICAgICAgIHByb21pc2VWYWx1ZSA9IFR5cGVFcnJvcigpO1xuICAgICAgICAgIGZpbmlzaCgpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdGhlbm5hYmxlKHRoZW4sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZpbmlzaChSRVNPTFZFRClcbiAgICAgICAgICB9LCBmaW5pc2gsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZpbmlzaChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIFJFU09MVkVEKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG4gIG0uZGVmZXJyZWQub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAodHlwZS5jYWxsKGUpID09PSBcIltvYmplY3QgRXJyb3JdXCIgJiYgIWUuY29uc3RydWN0b3IudG9TdHJpbmcoKS5tYXRjaCgvIEVycm9yLykpIHRocm93IGVcbiAgfTtcblxuICBtLnN5bmMgPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgdmFyIG1ldGhvZCA9IFwicmVzb2x2ZVwiO1xuICAgIGZ1bmN0aW9uIHN5bmNocm9uaXplcihwb3MsIHJlc29sdmVkKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmVzdWx0c1twb3NdID0gdmFsdWU7XG4gICAgICAgIGlmICghcmVzb2x2ZWQpIG1ldGhvZCA9IFwicmVqZWN0XCI7XG4gICAgICAgIGlmICgtLW91dHN0YW5kaW5nID09PSAwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucHJvbWlzZShyZXN1bHRzKTtcbiAgICAgICAgICBkZWZlcnJlZFttZXRob2RdKHJlc3VsdHMpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGRlZmVycmVkID0gbS5kZWZlcnJlZCgpO1xuICAgIHZhciBvdXRzdGFuZGluZyA9IGFyZ3MubGVuZ3RoO1xuICAgIHZhciByZXN1bHRzID0gbmV3IEFycmF5KG91dHN0YW5kaW5nKTtcbiAgICBpZiAoYXJncy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXJnc1tpXS50aGVuKHN5bmNocm9uaXplcihpLCB0cnVlKSwgc3luY2hyb25pemVyKGksIGZhbHNlKSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBkZWZlcnJlZC5yZXNvbHZlKFtdKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlXG4gIH07XG4gIGZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7cmV0dXJuIHZhbHVlfVxuXG4gIGZ1bmN0aW9uIGFqYXgob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmRhdGFUeXBlICYmIG9wdGlvbnMuZGF0YVR5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJqc29ucFwiKSB7XG4gICAgICB2YXIgY2FsbGJhY2tLZXkgPSBcIm1pdGhyaWxfY2FsbGJhY2tfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKSArIFwiX1wiICsgKE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDFlMTYpKS50b1N0cmluZygzNik7XG4gICAgICB2YXIgc2NyaXB0ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG5cbiAgICAgIHdpbmRvd1tjYWxsYmFja0tleV0gPSBmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHNjcmlwdCk7XG4gICAgICAgIG9wdGlvbnMub25sb2FkKHtcbiAgICAgICAgICB0eXBlOiBcImxvYWRcIixcbiAgICAgICAgICB0YXJnZXQ6IHtcbiAgICAgICAgICAgIHJlc3BvbnNlVGV4dDogcmVzcFxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHdpbmRvd1tjYWxsYmFja0tleV0gPSB1bmRlZmluZWRcbiAgICAgIH07XG5cbiAgICAgIHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAkZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuXG4gICAgICAgIG9wdGlvbnMub25lcnJvcih7XG4gICAgICAgICAgdHlwZTogXCJlcnJvclwiLFxuICAgICAgICAgIHRhcmdldDoge1xuICAgICAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICAgICAgICByZXNwb25zZVRleHQ6IEpTT04uc3RyaW5naWZ5KHtlcnJvcjogXCJFcnJvciBtYWtpbmcganNvbnAgcmVxdWVzdFwifSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB3aW5kb3dbY2FsbGJhY2tLZXldID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfTtcblxuICAgICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9O1xuXG4gICAgICBzY3JpcHQuc3JjID0gb3B0aW9ucy51cmxcbiAgICAgICAgKyAob3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPiAwID8gXCImXCIgOiBcIj9cIilcbiAgICAgICAgKyAob3B0aW9ucy5jYWxsYmFja0tleSA/IG9wdGlvbnMuY2FsbGJhY2tLZXkgOiBcImNhbGxiYWNrXCIpXG4gICAgICAgICsgXCI9XCIgKyBjYWxsYmFja0tleVxuICAgICAgICArIFwiJlwiICsgYnVpbGRRdWVyeVN0cmluZyhvcHRpb25zLmRhdGEgfHwge30pO1xuICAgICAgJGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhciB4aHIgPSBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0O1xuICAgICAgeGhyLm9wZW4ob3B0aW9ucy5tZXRob2QsIG9wdGlvbnMudXJsLCB0cnVlLCBvcHRpb25zLnVzZXIsIG9wdGlvbnMucGFzc3dvcmQpO1xuICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDMwMCkgb3B0aW9ucy5vbmxvYWQoe3R5cGU6IFwibG9hZFwiLCB0YXJnZXQ6IHhocn0pO1xuICAgICAgICAgIGVsc2Ugb3B0aW9ucy5vbmVycm9yKHt0eXBlOiBcImVycm9yXCIsIHRhcmdldDogeGhyfSlcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGlmIChvcHRpb25zLnNlcmlhbGl6ZSA9PT0gSlNPTi5zdHJpbmdpZnkgJiYgb3B0aW9ucy5kYXRhICYmIG9wdGlvbnMubWV0aG9kICE9PSBcIkdFVFwiKSB7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiKVxuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMuZGVzZXJpYWxpemUgPT09IEpTT04ucGFyc2UpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJBY2NlcHRcIiwgXCJhcHBsaWNhdGlvbi9qc29uLCB0ZXh0LypcIik7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY29uZmlnID09PSBGVU5DVElPTikge1xuICAgICAgICB2YXIgbWF5YmVYaHIgPSBvcHRpb25zLmNvbmZpZyh4aHIsIG9wdGlvbnMpO1xuICAgICAgICBpZiAobWF5YmVYaHIgIT0gbnVsbCkgeGhyID0gbWF5YmVYaHJcbiAgICAgIH1cblxuICAgICAgdmFyIGRhdGEgPSBvcHRpb25zLm1ldGhvZCA9PT0gXCJHRVRcIiB8fCAhb3B0aW9ucy5kYXRhID8gXCJcIiA6IG9wdGlvbnMuZGF0YVxuICAgICAgaWYgKGRhdGEgJiYgKHR5cGUuY2FsbChkYXRhKSAhPSBTVFJJTkcgJiYgZGF0YS5jb25zdHJ1Y3RvciAhPSB3aW5kb3cuRm9ybURhdGEpKSB7XG4gICAgICAgIHRocm93IFwiUmVxdWVzdCBkYXRhIHNob3VsZCBiZSBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgRm9ybURhdGEuIENoZWNrIHRoZSBgc2VyaWFsaXplYCBvcHRpb24gaW4gYG0ucmVxdWVzdGBcIjtcbiAgICAgIH1cbiAgICAgIHhoci5zZW5kKGRhdGEpO1xuICAgICAgcmV0dXJuIHhoclxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBiaW5kRGF0YSh4aHJPcHRpb25zLCBkYXRhLCBzZXJpYWxpemUpIHtcbiAgICBpZiAoeGhyT3B0aW9ucy5tZXRob2QgPT09IFwiR0VUXCIgJiYgeGhyT3B0aW9ucy5kYXRhVHlwZSAhPSBcImpzb25wXCIpIHtcbiAgICAgIHZhciBwcmVmaXggPSB4aHJPcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA8IDAgPyBcIj9cIiA6IFwiJlwiO1xuICAgICAgdmFyIHF1ZXJ5c3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZyhkYXRhKTtcbiAgICAgIHhock9wdGlvbnMudXJsID0geGhyT3B0aW9ucy51cmwgKyAocXVlcnlzdHJpbmcgPyBwcmVmaXggKyBxdWVyeXN0cmluZyA6IFwiXCIpXG4gICAgfVxuICAgIGVsc2UgeGhyT3B0aW9ucy5kYXRhID0gc2VyaWFsaXplKGRhdGEpO1xuICAgIHJldHVybiB4aHJPcHRpb25zXG4gIH1cbiAgZnVuY3Rpb24gcGFyYW1ldGVyaXplVXJsKHVybCwgZGF0YSkge1xuICAgIHZhciB0b2tlbnMgPSB1cmwubWF0Y2goLzpbYS16XVxcdysvZ2kpO1xuICAgIGlmICh0b2tlbnMgJiYgZGF0YSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IHRva2Vuc1tpXS5zbGljZSgxKTtcbiAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UodG9rZW5zW2ldLCBkYXRhW2tleV0pO1xuICAgICAgICBkZWxldGUgZGF0YVtrZXldXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1cmxcbiAgfVxuXG4gIG0ucmVxdWVzdCA9IGZ1bmN0aW9uKHhock9wdGlvbnMpIHtcbiAgICBpZiAoeGhyT3B0aW9ucy5iYWNrZ3JvdW5kICE9PSB0cnVlKSBtLnN0YXJ0Q29tcHV0YXRpb24oKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBtLmRlZmVycmVkKCk7XG4gICAgdmFyIGlzSlNPTlAgPSB4aHJPcHRpb25zLmRhdGFUeXBlICYmIHhock9wdGlvbnMuZGF0YVR5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJqc29ucFwiO1xuICAgIHZhciBzZXJpYWxpemUgPSB4aHJPcHRpb25zLnNlcmlhbGl6ZSA9IGlzSlNPTlAgPyBpZGVudGl0eSA6IHhock9wdGlvbnMuc2VyaWFsaXplIHx8IEpTT04uc3RyaW5naWZ5O1xuICAgIHZhciBkZXNlcmlhbGl6ZSA9IHhock9wdGlvbnMuZGVzZXJpYWxpemUgPSBpc0pTT05QID8gaWRlbnRpdHkgOiB4aHJPcHRpb25zLmRlc2VyaWFsaXplIHx8IEpTT04ucGFyc2U7XG4gICAgdmFyIGV4dHJhY3QgPSB4aHJPcHRpb25zLmV4dHJhY3QgfHwgZnVuY3Rpb24oeGhyKSB7XG4gICAgICByZXR1cm4geGhyLnJlc3BvbnNlVGV4dC5sZW5ndGggPT09IDAgJiYgZGVzZXJpYWxpemUgPT09IEpTT04ucGFyc2UgPyBudWxsIDogeGhyLnJlc3BvbnNlVGV4dFxuICAgIH07XG4gICAgeGhyT3B0aW9ucy51cmwgPSBwYXJhbWV0ZXJpemVVcmwoeGhyT3B0aW9ucy51cmwsIHhock9wdGlvbnMuZGF0YSk7XG4gICAgeGhyT3B0aW9ucyA9IGJpbmREYXRhKHhock9wdGlvbnMsIHhock9wdGlvbnMuZGF0YSwgc2VyaWFsaXplKTtcbiAgICB4aHJPcHRpb25zLm9ubG9hZCA9IHhock9wdGlvbnMub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGUgPSBlIHx8IGV2ZW50O1xuICAgICAgICB2YXIgdW53cmFwID0gKGUudHlwZSA9PT0gXCJsb2FkXCIgPyB4aHJPcHRpb25zLnVud3JhcFN1Y2Nlc3MgOiB4aHJPcHRpb25zLnVud3JhcEVycm9yKSB8fCBpZGVudGl0eTtcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gdW53cmFwKGRlc2VyaWFsaXplKGV4dHJhY3QoZS50YXJnZXQsIHhock9wdGlvbnMpKSk7XG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwibG9hZFwiKSB7XG4gICAgICAgICAgaWYgKHR5cGUuY2FsbChyZXNwb25zZSkgPT09IEFSUkFZICYmIHhock9wdGlvbnMudHlwZSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXNwb25zZS5sZW5ndGg7IGkrKykgcmVzcG9uc2VbaV0gPSBuZXcgeGhyT3B0aW9ucy50eXBlKHJlc3BvbnNlW2ldKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICh4aHJPcHRpb25zLnR5cGUpIHJlc3BvbnNlID0gbmV3IHhock9wdGlvbnMudHlwZShyZXNwb25zZSlcbiAgICAgICAgfVxuICAgICAgICBkZWZlcnJlZFtlLnR5cGUgPT09IFwibG9hZFwiID8gXCJyZXNvbHZlXCIgOiBcInJlamVjdFwiXShyZXNwb25zZSlcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIG0uZGVmZXJyZWQub25lcnJvcihlKTtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpXG4gICAgICB9XG4gICAgICBpZiAoeGhyT3B0aW9ucy5iYWNrZ3JvdW5kICE9PSB0cnVlKSBtLmVuZENvbXB1dGF0aW9uKClcbiAgICB9O1xuICAgIGFqYXgoeGhyT3B0aW9ucyk7XG4gICAgZGVmZXJyZWQucHJvbWlzZSh4aHJPcHRpb25zLmluaXRpYWxWYWx1ZSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2VcbiAgfTtcblxuICAvL3Rlc3RpbmcgQVBJXG4gIG0uZGVwcyA9IGZ1bmN0aW9uKG1vY2spIHtcbiAgICBpbml0aWFsaXplKHdpbmRvdyA9IG1vY2sgfHwgd2luZG93KTtcbiAgICByZXR1cm4gd2luZG93O1xuICB9O1xuICAvL2ZvciBpbnRlcm5hbCB0ZXN0aW5nIG9ubHksIGRvIG5vdCB1c2UgYG0uZGVwcy5mYWN0b3J5YFxuICBtLmRlcHMuZmFjdG9yeSA9IGFwcDtcblxuICByZXR1cm4gbVxufSkodHlwZW9mIHdpbmRvdyAhPSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pO1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZSAhPT0gbnVsbCAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBtO1xuZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIGRlZmluZShmdW5jdGlvbigpIHtyZXR1cm4gbX0pO1xuIiwidmFyIFBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlKHtcbiAgbGlzdDogW1xuICAgIHsgdGl0bGU6ICdBYm91dDEnLCB1cmw6ICcvYWJvdXQvb25lJyB9LFxuICAgIHsgdGl0bGU6ICdBYm91dDInLCB1cmw6ICcvYWJvdXQvdHdvJyB9LFxuICAgIHsgdGl0bGU6ICdBYm91dDMnLCB1cmw6ICcvYWJvdXQvdGhyZWUnIH0sXG4gICAgeyB0aXRsZTogJ0Fib3V0NCcsIHVybDogJy9hYm91dC9mb3VyJyB9XG4gIF0sXG4gIHRpdGxlOiAnQWJvdXQnXG59KTtcbiIsIi8vIGJhY2suanNcblxudmFyIG0gPSByZXF1aXJlKCdtaXRocmlsJyk7XG5cbm0ucm91dGUucHJldmlvdXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRlbGltaXRlciA9ICcvJztcbiAgdmFyIHByZXZpb3VzO1xuXG4gIHZhciByb3V0ZSA9IG0ucm91dGUoKSB8fCBkZWxpbWl0ZXI7XG4gIGlmIChyb3V0ZS5sZW5ndGggPj0gMSkge1xuICAgIHZhciBhcnIgPSByb3V0ZS5zcGxpdChkZWxpbWl0ZXIpO1xuXG4gICAgYXJyLnBvcCgpO1xuXG4gICAgcHJldmlvdXMgPSBhcnIuam9pbihkZWxpbWl0ZXIpO1xuICB9XG4gIGVsc2Uge1xuICAgIHByZXZpb3VzID0gZGVsaW1pdGVyO1xuICB9XG5cbiAgcmV0dXJuIHByZXZpb3VzO1xufTtcbm0ucm91dGUuYmFjayA9IGZ1bmN0aW9uKCkge1xuICBtLnJvdXRlKG0ucm91dGUucHJldmlvdXMoKSk7XG59O1xuXG52YXIgY29uZmlnID0ge1xuICBvbmNsaWNrOiBtLnJvdXRlLmJhY2ssXG4gIHN0eWxlOiB7XG4gICAgY3Vyc29yOiAncG9pbnRlcidcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtKCcuYmFjaycsIFtcbiAgbSgnYScsIGNvbmZpZywgJ0JhY2snKVxuXSk7XG4iLCIvLyBib2R5LmpzXG5cbnZhciBCb2R5ID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxpc3QgPSBjb25maWcubGlzdCB8fCBbXTtcblxuICAgIHJldHVybiBtKFwidWwubGlzdFwiLCBbXG4gICAgICBsaXN0Lm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciBpdGVtQ29uZmlnID0ge1xuICAgICAgICAgIGNvbmZpZzogbS5yb3V0ZSxcbiAgICAgICAgICBocmVmOiBpdGVtLnVybFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBtKFwibGlcIiwgW1xuICAgICAgICAgIG0oXCJhXCIsIGl0ZW1Db25maWcsIGl0ZW0udGl0bGUpXG4gICAgICAgIF0pO1xuICAgICAgfSlcbiAgICBdKTtcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQm9keTtcbiIsIi8vIGV2ZW50cy5qc1xuXG52YXIgUGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2Uoe1xuICB0aXRsZTogJ0V2ZW50cydcbn0pO1xuIiwiLy8gSGVhZGVyLmpzXG5cbnZhciBiYWNrID0gcmVxdWlyZSgnLi9iYWNrJyk7XG5cbnZhciBoZWFkZXIgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuXG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gW1xuICAgICAgYmFjayxcbiAgICAgIG0oJ2gxJywgY29uZmlnLnRpdGxlKSxcbiAgICBdO1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBoZWFkZXI7XG4iLCJ2YXIgbGF5b3V0ID0gZnVuY3Rpb24oaGVhZGVyLCBib2R5LCB0YWJzKSB7XG4gIHJldHVybiBtKFwiLmxheW91dFwiLCBbXG4gICAgbShcImhlYWRlclwiLCBoZWFkZXIpLFxuICAgIG0oXCJtYWluXCIsIGJvZHkpLFxuICAgIG0oXCJuYXZcIiwgdGFicylcbiAgXSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxheW91dDtcbiIsInZhciBtaXhpbkxheW91dCA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICB2YXIgbGF5b3V0ID0gY29uZmlnLmxheW91dDtcbiAgdmFyIGhlYWRlciA9IGNvbmZpZy5oZWFkZXI7XG4gIHZhciBib2R5ICAgPSBjb25maWcuYm9keTtcbiAgdmFyIHRhYnMgICA9IGNvbmZpZy50YWJzO1xuXG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbGF5b3V0KGhlYWRlcigpLCBib2R5KCksIHRhYnMoKSk7XG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1peGluTGF5b3V0O1xuIiwidmFyIFBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlKHtcbiAgbGlzdDogW1xuICAgIHt0aXRsZTogJ0ZJRE0gTmV3cycsICAgICAgICAgIHVybDogJy9uZXdzL2Jsb2dzL2ZpZG0tbmV3cyd9LFxuICAgIHt0aXRsZTogJ0ZJRE0gTXVzZXVtJywgICAgICAgIHVybDogJy9uZXdzL2Jsb2dzL2ZpZG0tbXVzZXVtJ30sXG4gICAge3RpdGxlOiAnRklETSBEaWdpdGFsIEFydHMnLCAgdXJsOiAnL25ld3MvYmxvZ3MvZmlkbS1kaWdpdGFsLWFydHMnfSxcbiAgICB7dGl0bGU6ICdGYXNoaW9uIENsdWInLCAgICAgICB1cmw6ICcvbmV3cy9ibG9ncy9mYXNoaW9uLWNsdWInfVxuICBdLFxuICB0aXRsZTogJ05ld3MgQmxvZ3MnXG59KTtcbiIsInZhciBQYWdlID0gcmVxdWlyZSgnLi9wYWdlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZSh7XG4gIHRpdGxlOiAnRmFzaGlvbiBDbHViJ1xufSk7XG4iLCJ2YXIgUGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2Uoe1xuICB0aXRsZTogJ0ZJRE0gRGlnaXRhbCBBcnRzJ1xufSk7XG4iLCJ2YXIgUGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2Uoe1xuICB0aXRsZTogJ0ZJRE0gTXVzZXVtJ1xufSk7XG4iLCJ2YXIgUGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2Uoe1xuICB0aXRsZTogJ0ZJRE0gTmV3cydcbn0pO1xuIixudWxsLCJ2YXIgUGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2Uoe1xuICBsaXN0OiBbXG4gICAgeyB0aXRsZTogJ0Jsb2dzJywgIHVybDogJy9uZXdzL2Jsb2dzJyB9LFxuICAgIHsgdGl0bGU6ICdUb3BpY3MnLCB1cmw6ICcvbmV3cy90b3BpY3MnIH0sXG4gICAgeyB0aXRsZTogJ1RyZW5kcycsIHVybDogJy9uZXdzL3RyZW5kcycgfVxuICBdLFxuICB0aXRsZTogJ05ld3MnXG59KTtcbiIsIi8vIHBhZ2UuanNcblxudmFyIG1peGluTGF5b3V0ID0gcmVxdWlyZShcIi4vbWl4aW5MYXlvdXRcIik7XG52YXIgbGF5b3V0ICAgICAgPSByZXF1aXJlKFwiLi9sYXlvdXRcIik7XG52YXIgdGFicyAgICAgICAgPSByZXF1aXJlKFwiLi90YWJzXCIpO1xudmFyIGhlYWRlciAgICAgID0gcmVxdWlyZShcIi4vaGVhZGVyXCIpO1xudmFyIGJvZHkgICAgICAgID0gcmVxdWlyZShcIi4vYm9keVwiKTtcblxudmFyIFBhZ2UgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgdmFyIHRpdGxlID0gY29uZmlnLnRpdGxlIHx8IFwiXCI7XG4gIHZhciBsaXN0ICA9IGNvbmZpZy5saXN0IHx8IFtdO1xuICByZXR1cm4ge1xuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge30sXG4gICAgdmlldzogbWl4aW5MYXlvdXQoe1xuICAgICAgbGF5b3V0IDogbGF5b3V0LFxuICAgICAgaGVhZGVyIDogaGVhZGVyKHt0aXRsZTogdGl0bGV9KSxcbiAgICAgIGJvZHkgICA6IGJvZHkoe2xpc3Q6IGxpc3R9KSxcbiAgICAgIHRhYnMgICA6IHRhYnNcbiAgICB9KVxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlO1xuIiwiLy8gYXBwLmpzXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiAnL25ld3MnLFxuICBtYXA6IHtcbiAgICAnL25ld3MnICAgICAgICAgICAgICAgICAgICAgICAgICAgOiByZXF1aXJlKCcuL25ld3MnKSxcbiAgICAnL25ld3MvYmxvZ3MnICAgICAgICAgICAgICAgICAgICAgOiByZXF1aXJlKCcuL25ld3MtYmxvZ3MnKSxcbiAgICAnL25ld3MvYmxvZ3MvZmlkbS1uZXdzJyAgICAgICAgICAgOiByZXF1aXJlKCcuL25ld3MtZmlkbS1uZXdzJyksXG4gICAgJy9uZXdzL2Jsb2dzL2ZpZG0tbXVzZXVtJyAgICAgICAgIDogcmVxdWlyZSgnLi9uZXdzLWZpZG0tbXVzZXVtJyksXG4gICAgJy9uZXdzL2Jsb2dzL2ZpZG0tZGlnaXRhbC1hcnRzJyAgIDogcmVxdWlyZSgnLi9uZXdzLWZpZG0tZGlnaXRhbC1hcnRzJyksXG4gICAgJy9uZXdzL2Jsb2dzL2Zhc2hpb24tY2x1YicgICAgICAgIDogcmVxdWlyZSgnLi9uZXdzLWZhc2hpb24tY2x1YicpLFxuICAgICcvbmV3cy90b3BpY3MnICAgICAgICAgICAgICAgICAgICA6IHJlcXVpcmUoJy4vbmV3cy10b3BpY3MnKSxcbiAgICAnL2Fib3V0JyAgICAgICAgICAgICAgICAgICAgICAgICAgOiByZXF1aXJlKCcuL2Fib3V0JyksXG4gICAgJy9ldmVudHMnICAgICAgICAgICAgICAgICAgICAgICAgIDogcmVxdWlyZSgnLi9ldmVudHMnKVxuICB9XG59O1xuIiwibSA9IHJlcXVpcmUoJ21pdGhyaWwnKTtcblxudmFyIHRhYiA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICByZXR1cm4gbSgnYScsIHtcbiAgICAgIGhyZWY6ICcvJyArIGNvbmZpZy50aXRsZS50b0xvd2VyQ2FzZSgpLFxuICAgICAgY29uZmlnOiBtLnJvdXRlXG4gICAgfSxcbiAgICBjb25maWcudGl0bGVcbiAgKTtcbn07XG5cbnZhciB0YWJzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBtKCcudGFicycsIFtcbiAgICB0YWIoe3RpdGxlOiAnTmV3cycgIH0pLFxuICAgIHRhYih7dGl0bGU6ICdFdmVudHMnfSksXG4gICAgdGFiKHt0aXRsZTogJ0Fib3V0JyB9KVxuICBdKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdGFicztcbiJdfQ==
