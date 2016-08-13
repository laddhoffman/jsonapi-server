/* @flow weak */
"use strict";
var handlerEnforcer = module.exports = { };

var debug = require("./debugging.js");

/**
 * handlers is an object with properties search, find, create, update, delete
 * that each map to a function that accepts two arguments: request and callback.
 *  request is an object, and callback is a function that accepts 3 arguments:
 *  err, records, and count.
 */
handlerEnforcer.wrap = function(handlers) {
  handlers.search = handlerEnforcer._search(handlers);
  handlers.find = handlerEnforcer._find(handlers);
  handlers.create = handlerEnforcer._create(handlers);
  handlers.update = handlerEnforcer._update(handlers);
  handlers.delete = handlerEnforcer._delete(handlers);
};

/**
 * Helper function to wrap each supplied handler function, so that we can
 * verify it has the correct number of arguments, as well as perform logging.
 */
handlerEnforcer._wrapHandler = function(handlers, operation, outCount) {
  if (typeof outCount !== "number") {
    throw new Error("Invalid use of handlerEnforcer._wrapHandler!");
  }

  // Store the handler function for the requested action, so we can wrap it
  var original = handlers[operation];

  // No handler?
  if (!original) return null;

  // Now return the wrapped handler function
  return function() {
    var argsIn = Array.prototype.slice.call(arguments);
    var requestParams = argsIn[0].params;

    // We wrap the callback function. Here we store the supplied callback.
    var callback = argsIn.pop();

    //  Now build our callback wrapper
    argsIn.push(function() {
      // Make sure there are the correct number of arguments getting passed
      // back to the callback
      var argsOut = Array.prototype.slice.call(arguments);
      argsOut = argsOut.slice(0, outCount);
      while (argsOut.length < outCount) {
        argsOut.push(null);
      }

      // Do some logging
      debug.handler[operation](JSON.stringify(requestParams), JSON.stringify(argsOut));

      // Call the originally supplied callback
      return callback.apply(null, argsOut);
    });

    // This wrapper now calls the originally provided handler function for this
    // method, supplying the original handlers object as its 'this', and
    // the arguments list we augmented to wrap its callback
    // the result.
    original.apply(handlers, argsIn);
  };
};

handlerEnforcer._search = function(handlers) {
  return handlerEnforcer._wrapHandler(handlers, "search", 3);
};

handlerEnforcer._find = function(handlers) {
  return handlerEnforcer._wrapHandler(handlers, "find", 2);
};

handlerEnforcer._create = function(handlers) {
  return handlerEnforcer._wrapHandler(handlers, "create", 2);
};

handlerEnforcer._update = function(handlers) {
  return handlerEnforcer._wrapHandler(handlers, "update", 2);
};

handlerEnforcer._delete = function(handlers) {
  return handlerEnforcer._wrapHandler(handlers, "delete", 1);
};
