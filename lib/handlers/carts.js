/*
 * Request Handlers for Carts
 */

// Dependencies
const _data = require('../data')

// Container for all the carts methods
const carts = {}

// Returns all the items that do not exist
getNotExistentItems = (items) => {
  const notExistentItems = []
            
  _data.listSync('items', (err, allItems) => {
    if(!err && allItems && allItems.length > 0) {
      items.forEach(item => {
        if(!allItems.includes(item)) notExistentItems.push(item)
      })
    }
  })

  return notExistentItems
}  

// Carts - post
// Required data: items
carts.post = (data, callback) => {
  // Check that all required fields are filled out
  const items = Array.isArray(data.payload.items) ? data.payload.items : false

  if(items) {
    // Get token from headers
    const token = typeof data.headers.token == 'string' ? data.headers.token : false

    // Read and validate the token
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && tokenData && tokenData.expires > Date.now()) {
   
        // Make sure the cart doesn't already exist based on the user email
        _data.read('carts', tokenData.email, (err, _) => {
          if(err){  
            //Validate that all the items exist
            const notExistentItems = getNotExistentItems(items)
            
            //If all the items exist, create the cart
            if(notExistentItems.length == 0) {
              
              // Create the cart object
              const cartObject = {
                'email' : tokenData.email,
                'items' : items
              }

              // Store the cart
              _data.create('carts', tokenData.email, cartObject, err => {
                if(!err){
                  callback(200)
                } else {
                  callback(500, {'Error' : 'Could not create the new cart'})
                }
              })
            } else {
              // Some items do not exist
              callback(400, {'Error' : `These items do not exist: ${notExistentItems}`})
            }   
          } else {
            // Cart already exists
            callback(400, {'Error' : 'A cart for the current user already exists'})
          }
        })
      } else {
        callback(403, {'Error' : 'Missing required token in header, or token is invalid'})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
}

// Carts - get
// Returns the cart for the current user
carts.get = (data, callback) => {
  // Get token from headers
  const token = typeof data.headers.token == 'string' ? data.headers.token : false
  
  // Read and validate the token
  _data.read('tokens', token, (err, tokenData) => {
    if(!err && tokenData && tokenData.expires > Date.now()) {

      // Lookup the cart
      _data.read('carts', tokenData.email, (err, data) => {
        if(!err && data) {
          callback(200, data)
        } else {
          callback(404, {'Error' : 'Cart not found'})
        }
      })
    } else {
      callback(403, {'Error' : 'Missing required token in header, or token is invalid'})
    }
  })
}

// Carts - put
// Required data: items 
carts.put = (data, callback) => {
  // Check that all required fields are filled out
  const items = Array.isArray(data.payload.items) ? data.payload.items : false

  if(items) {
    // Get token from headers
    const token = typeof data.headers.token == 'string' ? data.headers.token : false

    // Read and validate the token
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && tokenData && tokenData.expires > Date.now()) {

        //Validate that all the items exist
        const notExistentItems = getNotExistentItems(items)
            
        //If all the items exist, create the cart
        if(notExistentItems.length == 0) {
          
          // Lookup the cart
          _data.read('carts', tokenData.email, (err, itemData) => {
            if(!err && itemData) {
              // Update the items
              itemData.items = items
              
              // Store the new updates
              _data.update('carts', tokenData.email, itemData, err => {
                if(!err) {
                  callback(200)
                } else {
                  callback(500, {'Error' : 'Could not update the cart'})
                }
              })
            } else {
              callback(400, {'Error' : 'Specified cart does not exist'})
            }
          })
        } else {
          // Some items do not exist
          callback(400, {'Error' : `These items do not exist: ${notExistentItems}`})
        }
      } else {
        callback(403, {"Error" : "Missing required token in header, or token is invalid"})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
}

// Carts - delete
carts.delete = (data, callback) => {
  // Get token from headers
  const token = typeof data.headers.token == 'string' ? data.headers.token : false

  // Read and validate the token
  _data.read('tokens', token, (err, tokenData) => {
    if(!err && tokenData && tokenData.expires > Date.now()) {
      // Lookup the user
      _data.read('carts', tokenData.email, (err, itemData) => {
        if(!err && itemData) {
          // Delete the cart's data
          _data.delete('carts', tokenData.email, err => {
            if(!err) {
              callback(200)
            } else {
              callback(500, {'Error' : 'Could not delete the specified cart'})
            }
          })
        } else {
          callback(400, {'Error' : 'Could not find the specified cart'})
        }
      })
    } else {
      callback(403, {"Error" : "Missing required token in header, or token is invalid"})
    }
  })
}

// Export the handlers for carts
module.exports = carts
