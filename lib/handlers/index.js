/*
 * Request Handlers
 */

// Dependencies
const _users = require('./users')
const _tokens = require('./tokens')
const _items = require('./items')
const _carts = require('./carts')
const _orders = require('./orders')

// Acceptable methods for each handler
const acceptableMethods = ['post', 'get', 'put', 'delete']

// Define all the handlers
const handlers = {}

// Ping
handlers.ping = (_, callback) => setTimeout(() => callback(200), 5000)

// Not-Found
handlers.notFound = (_, callback) => callback(404)

// Calls a specific handler method
const callHandlerMethod = (handler, data, callback) => {
  if(acceptableMethods.includes(data.method)) {
    handler[data.method](data, callback)
  } else {
    callback(405)
  }
}

// Users
handlers.users = (data, callback) => callHandlerMethod(_users, data, callback)

// Tokens
handlers.tokens = (data, callback) => callHandlerMethod(_tokens, data, callback)

// Items
handlers.items = (data, callback) => callHandlerMethod(_items, data, callback)

// Shopping Carts
handlers.carts = (data, callback) => callHandlerMethod(_carts, data, callback)

// Orders
handlers.orders = (data, callback) => callHandlerMethod(_orders, data, callback)

// Export the handlers
module.exports = handlers
