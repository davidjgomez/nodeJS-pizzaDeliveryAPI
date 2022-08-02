/*
 * Request Handlers for Items
 */

// Dependencies
const _data = require('../data')

// Container for all the items methods
const items = {}

// Items - post
// Required data: name, description, price
items.post = (data, callback) => {
  // Check that all required fields are filled out
  const name = typeof data.payload.name == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false
  const description = typeof data.payload.description == 'string' && data.payload.description.trim().length > 0 ? data.payload.description.trim() : false
  const price = typeof data.payload.price == 'number' && data.payload.price > 0 ? data.payload.price : false

  if(name && description && price) {

    // Get token from headers
    const token = typeof data.headers.token == 'string' ? data.headers.token : false

    // Read and validate the token
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && tokenData && tokenData.expires > Date.now()) {
   
        // Make sure the item doesn't already exist
        _data.read('items', name, (err, _) => {
          if(err){  
            // Create the item object
            const itemObject = {
              'name' : name,
              'description' : description,
              'price' : price
            }

            // Store the item
            _data.create('items', name, itemObject, err => {
              if(!err){
                callback(200)
              } else {
                callback(500, {'Error' : 'Could not create the new item'})
              }
            })
          } else {
            // Item already exists
            callback(400, {'Error' : 'An item with that name already exists'})
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

// Items - get
// Optional data: name
// If name is present, returns that item, otherwise, returns all the items
items.get = (data, callback) => {
  // Check that name is valid
  const name = typeof data.queryStringObject.name == 'string' && data.queryStringObject.name.trim().length > 0 ? data.queryStringObject.name.trim() : false

  // Get token from headers
  const token = typeof data.headers.token == 'string' ? data.headers.token : false
  
  // Read and validate the token
  _data.read('tokens', token, (err, tokenData) => {
    if(!err && tokenData && tokenData.expires > Date.now()) {

      // Get one or all items depending on the name provided
      if(name) {
        // Lookup the item
        _data.read('items', name, (err, data) => {
          if(!err && data) {
            callback(200, data)
          } else {
            callback(404, {'Error' : 'Item not found'})
          }
        })
      } else {
        // Lookup all the items
        _data.list('items', (err, items) => {
          if(!err && items && items.length > 0) {
            let data = []

            items.forEach(item => {
              // Read in the item data
              _data.readSync('items', item, (err, itemData) => {
                if(!err && itemData) {
                  data.push(itemData)
                } else {
                  callback(500, {'Error' : `Error reading item ${item}`})
                }
              })
            })

            callback(200, data)
          } else {
            callback(400, {'Error' : 'There are no items or there was an error reading the list'})
          }
        })
      }
    } else {
      callback(403, {'Error' : 'Missing required token in header'})
    }
  })
}

// Items - put
// Required data: name
// Optional data: description, price (at least one must be specified)
items.put = (data, callback) => {
  // Check for required field
  const name = typeof data.payload.name == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false

  // Check for optional fields
  const description = typeof data.payload.description == 'string' && data.payload.description.trim().length > 0 ? data.payload.description.trim() : false
  const price = typeof data.payload.price == 'number' && data.payload.price > 0 ? data.payload.price : false

  // Error if name is invalid
  if(name) {
    // Error if nothing is sent to update
    if(description || price) {

      // Get token from headers
      const token = typeof data.headers.token == 'string' ? data.headers.token : false

      // Read and validate the token
      _data.read('tokens', token, (err, tokenData) => {
        if(!err && tokenData && tokenData.expires > Date.now()) {

          // Lookup the item
          _data.read('items', name, (err, itemData) => {
            if(!err && itemData) {
              // Update the fields if necessary
              if(description) itemData.description = description
              if(price) itemData.price = price
              
              // Store the new updates
              _data.update('items', name, itemData, err => {
                if(!err) {
                  callback(200)
                } else {
                  callback(500, {'Error' : 'Could not update the item'})
                }
              })
            } else {
              callback(400, {'Error' : 'Specified item does not exist'})
            }
          })
        } else {
          callback(403, {"Error" : "Missing required token in header, or token is invalid"})
        }
      })
    } else {
      callback(400, {'Error' : 'Missing fields to update'})
    }
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Items - delete
// Required data: name
items.delete = (data, callback) => {
  // Check that name is valid
  const name = typeof data.queryStringObject.name == 'string' && data.queryStringObject.name.trim().length > 0 ? data.queryStringObject.name.trim() : false
  
  if(name) {
    // Get token from headers
    const token = typeof data.headers.token == 'string' ? data.headers.token : false

    // Read and validate the token
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && tokenData && tokenData.expires > Date.now()) {
        // Lookup the user
        _data.read('items', name, (err, itemData) => {
          if(!err && itemData) {
            // Delete the item's data
            _data.delete('items', name, err => {
              if(!err) {
                callback(200)
              } else {
                callback(500, {'Error' : 'Could not delete the specified item'})
              }
            })
          } else {
            callback(400, {'Error' : 'Could not find the specified item'})
          }
        })
      } else {
        callback(403, {"Error" : "Missing required token in header, or token is invalid"})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Export the handlers for items
module.exports = items
