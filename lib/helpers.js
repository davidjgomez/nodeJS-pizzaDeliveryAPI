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

helpers.sendStripePayment = (amount, paymentMethod, callback) => {
  // Validate parameters
  amount = typeof amount == 'number' ? amount : false
  paymentMethod = typeof paymentMethod == 'string' && paymentMethod.trim().length > 0 ? paymentMethod.trim() : false

  if(amount && paymentMethod){
    // Configure the request payload
    const payload = {
      "amount" : amount * 100, // Decimals added to the amount
      "currency" : "USD",
      "payment_method": `${paymentMethod}`
    }

    const stringPayload = querystring.stringify(payload)

    // Configure the request details
    const requestDetails = {
      hostname : 'api.stripe.com',
      method : 'POST',
      path : '/v1/payment_intents',
      auth : `${config.stripe.secret}`,
      headers : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload) 
      }
    }

    // Instantiate the request object
    // Callback successfully if the request went through
    const req = https.request(requestDetails, res => {
      res.on('data', d => {
        callback(!/20[01]/.test(res.statusCode) ? 
           `Error when creating the payment intent in Stripe (${res.statusCode} - ${res.statusMessage}): ${JSON.parse(d).error.message}` : false)
      })
    })

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

helpers.sendMailgunEmail = (mail, items, amount, callback) => {
  // Validate parameters
  mail = typeof mail == 'string' && mail.trim().length > 0 ? mail.trim() : false
  items = Array.isArray(items) ? items : false
  amount = typeof amount == 'number' ? amount : false
  
  if(mail && items && amount){

    const stringPayload = querystring.stringify(payload)

    // Configure the request details
    const requestDetails = {
      hostname : 'api.mailgun.net',
      method : 'POST',
      path : `/v3/${config.mailgun.domain}/messages`,
      headers : {
        'Content-Type' : 'multipart/form-data; boundary=bbbounddd',
        'Authorization' : `Basic ${config.mailgun.secret}`,
        'Content-Length' : Buffer.byteLength(stringPayload) 
      }
      /**formData : {
        'from' : `postmaster@${config.mailgun.domain}`,
        'to' : `${mail}`,
        'subject' : 'You have made a Pizza Order!',
        'text' : `You have ordered ${Array.from(items).map(i => i.name)} for a total amount of ${amount}`
      }*/
    }

    // Instantiate the request object
    // Callback successfully if the request went through
    const req = https.request(requestDetails, res => {
      res.on('data', d => {
        callback(!/20[01]/.test(res.statusCode) ? 
           `Error when sendind the email through Mailgun (${res.statusCode} - ${res.statusMessage}): ${d}` : false)
        process.stdout.write(d)
      })
    })

    // Bind to the error event so it doesn't get thrown
    req.on('error', e => callback(e))

    // Add the payload
    req.write(stringPayload)

    // End the request
    req.end()

    process.stdout.write(JSON.stringify(requestDetails))
  } else {
    callback('Given parameters were missing or invalid')
  }
}

// Export the module
module.exports = helpers
