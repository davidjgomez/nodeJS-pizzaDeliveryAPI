/*
 * Pizza Delivery API
 */

// Dependencies
const server = require('./lib/server')

// Declare the app
const app = {}

// Init 
app.init = () => {

  // Start the server
  server.init()
}

// Self executing
app.init()

// Export the app
module.exports = app
