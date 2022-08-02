/*
 * Request Handlers for Users
 */

// Dependencies
const _data = require('../data')
const _helpers = require('../helpers')
const tokens = require('./tokens')

// Container for all the users methods
const users = {}

// Users - post
// Required data: name, email, address, password
users.post = (data, callback) => {
  // Check that all required fields are filled out
  const name = typeof data.payload.name == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false
  const email = typeof data.payload.email == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false
  const address = typeof data.payload.address == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false
  const password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  if(name && email && address && password) {
    // Make sure the user doesn't already exist
    _data.read('users', email, (err, _) => {
      if(err){
        // Hash the password
        const hashedPassword = _helpers.hash(password)

        // Create the user object
        if(hashedPassword) {
      
          const userObject = {
            'name' : name,
            'email' : email,
            'address' : address,
            'hashedPassword' : hashedPassword
          }

          // Store the user
          _data.create('users', email, userObject, err => {
            if(!err){
              callback(200)
            } else {
              callback(500, {'Error' : 'Could not create the new user'})
            }
          })
        } else {
          callback(500, {'Error' : 'Could not hash the user\'s password'})
        }
      } else {
        // User already exists
        callback(400, {'Error' : 'A user with that email already exists'})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
}

// Users - get
// Required data: email
users.get = (data, callback) => {
  // Check that email is valid
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false

  if(email) {
    // Get token from headers
    const token = typeof data.headers.token == 'string' ? data.headers.token : false
    
    // Verify that the given token is valid for the email
    tokens.verifyToken(token, email, tokenIsValid => {
      if(tokenIsValid) {
        // Lookup the user
        _data.read('users', email, (err, data) => {
          if(!err && data) {
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword
            callback(200, data)
          } else {
            callback(404)
          }
        })
      } else {
        callback(403, {'Error' : 'Missing required token in header, or token is invalid'})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Users - put
// Required data: email
// Optional data: name, address, password (at least one must be specified)
users.put = (data, callback) => {
  // Check for required field
  const email = typeof data.payload.email == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false

  // Check for optional fields
  const name = typeof data.payload.name == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false
  const address = typeof data.payload.address == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false
  const password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  // Error if email is invalid
  if(email) {
    // Error if nothing is sent to update
    if(name || address || password) {

      // Get token from headers
      const token = typeof data.headers.token == 'string' ? data.headers.token : false

      // Verify that the given token is valid for the email
      tokens.verifyToken(token, email, tokenIsValid => {
        if(tokenIsValid) {

          // Lookup the user
          _data.read('users', email, (err, userData) => {
            if(!err && userData) {
              // Update the fields if necessary
              if(name) userData.name = name
              if(address) userData.address = address
              if(password) userData.hashedPassword = _helpers.hash(password)
              
              // Store the new updates
              _data.update('users', email, userData, err => {
                if(!err) {
                  callback(200)
                } else {
                  callback(500, {'Error' : 'Could not update the user'})
                }
              })
            } else {
              callback(400, {'Error' : 'Specified user does not exist'})
            }
          })
        } else {
          callback(403, {'Error' : 'Missing required token in header, or token is invalid'})
        }
      })
    } else {
      callback(400, {'Error' : 'Missing fields to update'})
    }
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Users - delete
// Required data: email
// Cleanup old checks associated with the user
users.delete = (data, callback) => {
  // Check that email is valid
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false
  
  if(email) {
    // Get token from headers
    const token = typeof data.headers.token == 'string' ? data.headers.token : false

    // Verify that the given token is valid for the phone number
    tokens.verifyToken(token, email, tokenIsValid => {
      if(tokenIsValid) {
        // Lookup the user
        _data.read('users', email, (err, userData) => {
          if(!err && userData) {
            // Delete the user's data
            _data.delete('users', email, err => {
              if(!err) {
                // Delete each of the checks associated with the user
                const userChecks = Array.isArray(userData.checks) ? userData.checks : []
                const checksToDelete = userChecks.length

                if(checksToDelete > 0) {
                  let checksDeleted = 0
                  let deletionErrors = false

                  // Loop through the checks
                  userChecks.forEach(checkId => {
                    // Delete the check
                    _data.delete('checks', checkId, err => {
                      if(err) {
                        deletionErrors = true
                      }
                      
                      checksDeleted++

                      if(checksDeleted == checksToDelete) {
                        if(!deletionErrors) {
                          callback(200)
                        } else {
                          callback(500, {'Error' : "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully"})
                        }
                      }
                    })
                  })
                } else {
                  callback(200)
                }
              } else {
                callback(500, {'Error' : 'Could not delete the specified user'})
              }
            })
          } else {
            callback(400, {'Error' : 'Could not find the specified user'})
          }
        })
      } else {
        callback(403, {'Error' : 'Missing required token in header, or token is invalid'})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Export the handlers for users
module.exports = users
