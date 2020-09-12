/*
 * Helpers for various tasks
 */

// Dependencies
const config = require('./config')
const crypto = require('crypto')
const https = require('https')
const querystring = require('querystring')

// Container for all the helpers
const helpers = {}

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = str => {
  try {
    return JSON.parse(str)
  } catch(e) {
    return {}
  }
}

// Create a SHA256 hash
helpers.hash = str => 
  typeof str == 'string' && str.length > 0 ? 
  crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex') : false

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = strLength => {
  strLength = typeof strLength == 'number' && strLength > 0 ? strLength : false

  if(strLength) {
    // Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'

    // Start the final string
    let str = ''

    for(i = 1; i <= strLength; i++) {
        // Append a random character from the possibleCharacters string to the string
        str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
    }

    // Return the final string
    return str
  } else {
    return false
  }
}

helpers.sendTwilioSms = (phone, msg, callback) => {
  // Validate parameters
  phone = typeof phone == 'string' && phone.trim().length == 10 ? phone.trim() : false
  msg = typeof msg == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false
  
  if(phone && msg){
    // Configure the request payload
    const payload = {
      'From' : config.twilio.fromPhone,
      'To' : `+1${phone}`,
      'Body' : msg
    }

    const stringPayload = querystring.stringify(payload)

    // Configure the request details
    const requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.twilio.com',
      'method' : 'POST',
      'path' : `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      'auth' : `${config.twilio.accountSid}:${config.twilio.authToken}`,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    }

    // Instantiate the request object
    // Callback successfully if the request went through
    const req = https.request(requestDetails, res => 
      callback(!/20[01]/.test(res.statusCode) ? `Status code returned was ${res.statusCode}` : false))

    // Bind to the error event so it doesn't get thrown
    req.on('error', e => callback(e))

    // Add the payload
    req.write(stringPayload)

    // End the request
    req.end()
  } else {
    callback('Given parameters were missing or invalid')
  }
}

// Export the module
module.exports = helpers
