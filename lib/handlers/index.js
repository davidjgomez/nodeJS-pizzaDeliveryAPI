/*
 * Request Handlers
 */

// Dependencies
const _users = require('./users')
const _tokens = require('./tokens')
const _checks = require('./checks')

// Acceptable methods for each handler
const acceptableMethods = ['post', 'get', 'put', 'delete']

// Define all the handlers
const handlers = {}

// Ping
handlers.ping = (data, callback) => setTimeout(() => callback(200), 5000)

// Not-Found
handlers.notFound = (data, callback) => callback(404)

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

// Checks
handlers.checks = (data, callback) => callHandlerMethod(_checks, data, callback)

// Export the handlers
module.exports = handlers
