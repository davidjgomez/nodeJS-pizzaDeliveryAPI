/*
 * Server-related tasks
 */

// Dependencies
 const http = require('http')
 const https = require('https')
 const url = require('url')
 const StringDecoder = require('string_decoder').StringDecoder
 const config = require('./config')
 const fs = require('fs')
 const handlers = require('./handlers')
 const helpers = require('./helpers')
 const path = require('path')
 const util = require('util')
 const debug = util.debuglog('server')

// Instantiate the server module object
const server = {}

 // Instantiate the HTTP server
server.httpServer = http.createServer((req, res) => server.unifiedServer(req, res))

 // Instantiate the HTTPS server
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
}

server.httpsServer = https.createServer(server.httpsServerOptions, (req,res) => server.unifiedServer(req,res))

 // All the server logic for both the http and https server
server.unifiedServer = (req, res) => {

  // Parse the url
  const parsedUrl = url.parse(req.url, true)

  // Get the path
  const trimmedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '')

  // Get the query string as an object
  const queryStringObject = parsedUrl.query

  // Get the HTTP method
  const method = req.method.toLowerCase()

  //Get the headers as an object
  const headers = req.headers

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8')
  let buffer = ''

  req.on('data', data => buffer += decoder.write(data))

  req.on('end', () => {
      buffer += decoder.end()

      // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
      const chosenHandler = typeof server.router[trimmedPath] !== 'undefined' ? server.router[trimmedPath] : notFound

      // Construct the data object to send to the handler
      const data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : queryStringObject,
        'method' : method,
        'headers' : headers,
        'payload' : helpers.parseJsonToObject(buffer)
      }

      // Route the request to the handler specified in the router
      chosenHandler(data, (statusCode, payload) => {

        // Use the status code returned from the handler, or set the default status code to 200
        statusCode = typeof statusCode == 'number' ? statusCode : 200

        // Use the payload returned from the handler, or set the default payload to an empty object
        payload = typeof payload == 'object' ? payload : {}

        // Convert the payload to a string
        const payloadString = JSON.stringify(payload)

        // Return the response
        res.setHeader('Content-Type', 'application/json')
        res.writeHead(statusCode)
        res.end(payloadString)

        // If the response is 200, print green, otherwise print red
        debug(`\x1b[3${statusCode == 200 ? 2 : 1}m%s\x1b[0m`, `${method.toUpperCase()} /${trimmedPath} ${statusCode}`)
      })
  })
}

 // Define the request router
server.router = {
   'ping' : handlers.ping,
   'users' : handlers.users,
   'tokens' : handlers.tokens,
   'checks' : handlers.checks
 }

 // Init script
server.init = () => {

  // Print log based on the type of server
  const printLog = (type = 'HTTP', port = config.httpPort) => 
    console.log(`\x1b[3${type == 'HTTP' ? 6 : 5}m%s\x1b[0m`, `The ${type} server is running on port ${port}`)

  // Start the HTTP server
  server.httpServer.listen(config.httpPort, printLog())

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, printLog('HTTPS', config.httpsPort))
}

// Export the module
module.exports = server
