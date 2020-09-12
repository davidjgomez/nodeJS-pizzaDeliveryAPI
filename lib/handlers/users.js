/*
 * Request Handlers for Users
 */

// Dependencies
const tokens = require('./tokens')
const _data = require('../data')

// Container for all the users methods
const users = {}

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
users.post = (data, callback) => {
  // Check that all required fields are filled out
  const firstName = typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const phone = typeof data.payload.phone == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
  const password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
  const tosAgreement = typeof data.payload.tosAgreement == 'boolean' && data.payload.tosAgreement == true ? true : false

  if(firstName && lastName && phone && password && tosAgreement) {
    // Make sure the user doesnt already exist
    _data.read('users', phone, (err, data) => {
      if(err){
        // Hash the password
        const hashedPassword = helpers.hash(password)

        // Create the user object
        if(hashedPassword) {
          const userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          }

          // Store the user
          _data.create('users', phone, userObject, (err) => {
            if(!err){
              callback(200)
            } else {
              callback(500, {'Error' : 'Could not create the new user'})
            }
          })
        } else {
          callback(500, {'Error' : 'Could not hash the user\'s password.'})
        }
      } else {
        // User already exists
        callback(400, {'Error' : 'A user with that phone number already exists'})
      }
    })

  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
}

// Required data: phone
// Optional data: none
users.get = (data, callback) => {
  // Check that phone number is valid
  const phone = typeof data.queryStringObject.phone == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false

  if(phone) {
    // Get token from headers
    const token = typeof data.headers.token == 'string' ? data.headers.token : false
    
    // Verify that the given token is valid for the phone number
    tokens.verifyToken(token, phone, tokenIsValid => {
      if(tokenIsValid) {
        // Lookup the user
        _data.read('users', phone, (err, data) => {
          if(!err && data) {
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword
            callback(200, data)
          } else {
            callback(404)
          }
        })
      } else {
        callback(403, {"Error" : "Missing required token in header, or token is invalid."})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
users.put = (data, callback) => {
  // Check for required field
  const phone = typeof data.payload.phone == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false

  // Check for optional fields
  const firstName = typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  // Error if phone is invalid
  if(phone) {
    // Error if nothing is sent to update
    if(firstName || lastName || password) {

      // Get token from headers
      const token = typeof data.headers.token == 'string' ? data.headers.token : false

      // Verify that the given token is valid for the phone number
      tokens.verifyToken(token, phone, tokenIsValid => {
        if(tokenIsValid) {

          // Lookup the user
          _data.read('users', phone, (err, userData) => {
            if(!err && userData) {
              // Update the fields if necessary
              if(firstName) {
                userData.firstName = firstName
              }
              if(lastName) {
                userData.lastName = lastName
              }
              if(password){
                userData.hashedPassword = helpers.hash(password)
              }

              // Store the new updates
              _data.update('users', phone, userData, (err) => {
                if(!err) {
                  callback(200)
                } else {
                  callback(500, {'Error' : 'Could not update the user.'})
                }
              })
            } else {
              callback(400, {'Error' : 'Specified user does not exist.'})
            }
          })
        } else {
          callback(403, {"Error" : "Missing required token in header, or token is invalid."})
        }
      })
    } else {
      callback(400, {'Error' : 'Missing fields to update.'})
    }
  } else {
    callback(400, {'Error' : 'Missing required field.'})
  }
}

// Required data: phone
// Cleanup old checks associated with the user
users.delete = (data, callback) => {
  // Check that phone number is valid
  const phone = typeof data.queryStringObject.phone == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false
  
  if(phone) {

    // Get token from headers
    const token = typeof data.headers.token == 'string' ? data.headers.token : false

    // Verify that the given token is valid for the phone number
    tokens.verifyToken(token, phone, tokenIsValid => {
      if(tokenIsValid) {
        // Lookup the user
        _data.read('users', phone, (err, userData) => {
          if(!err && userData) {
            // Delete the user's data
            _data.delete('users',phone, err => {
              if(!err) {
                // Delete each of the checks associated with the user
                const userChecks = typeof userData.checks == 'object' && userData.checks instanceof Array ? userData.checks : []
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
                          callback(500, {'Error' : "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully."})
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
            callback(400, {'Error' : 'Could not find the specified user.'})
          }
        })
      } else {
        callback(403, {"Error" : "Missing required token in header, or token is invalid."})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Export the handlers for users
module.exports = users
