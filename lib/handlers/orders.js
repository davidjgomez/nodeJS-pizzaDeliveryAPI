/*
 * Request Handlers for Orders
 */

// Dependencies
const _data = require('../data')
const _helpers = require('../helpers')

// Container for all the orders methods
const orders = {}

// Returns the cart items based on the user email
getCartItems = (email, callback) => {
  let cartItems = []
            
  _data.listSync('carts', (err, allCarts) => {
    if(!err && allCarts && allCarts.length > 0 && allCarts.includes(email)) {

       // Read in the cart data
       _data.readSync('carts', email, (err, cartData) => {
        if(!err && cartData) {
          cartData.items.forEach(item => {
            _data.listSync('items', (err, allItems) => {
              if(!err && allItems && allItems.length > 0 && allItems.includes(item)) {
          
                 // Read in the cart data
                 _data.readSync('items', item, (err, itemData) => {
                  if(!err && itemData) {
                    cartItems.push(itemData)
                  } else {
                    callback(500, {'Error' : `Error reading item ${item} for ${email}`})
                  }
                })
              }
            })
          })
        } else {
          callback(500, {'Error' : `Error reading cart ${email}`})
        }
      })
    }
  })

  return cartItems
}

// Orders - post
orders.post = (data, callback) => {

 // Check that all required fields are filled out
 const paymentMethod = typeof data.payload.paymentMethod == 'string' && data.payload.paymentMethod.trim().length > 0 ? data.payload.paymentMethod.trim() : false

 if(paymentMethod) {
   // Get token from headers
   const token = typeof data.headers.token == 'string' ? data.headers.token : false

   // Read and validate the token
   _data.read('tokens', token, (err, tokenData) => {
     if(!err && tokenData && tokenData.expires > Date.now()) {
  
       // Make sure the order doesn't already exist based on the user email
       _data.read('orders', tokenData.email, (err, _) => {
         if(err) {  
           //Validate that the cart exists
           const cartItems = getCartItems(tokenData.email, callback)
           
           //If the cart exists, calculate the total amount for the order, create the order object and send it to Stripe
           if(cartItems.length > 0) { 
            
             const order = {
               'email': tokenData.email,
               'items': cartItems,
               'totalAmount': cartItems.reduce((previousItem, nextItem) => (previousItem.price + nextItem.price), {"price": 0})
             }
             
             _helpers.sendStripePayment(order.totalAmount, paymentMethod, err => {
               if(!err) {

                _data.create('orders', order.email, order, err => {
                 if (!err) {
                  
                  _helpers.sendMailgunEmail(order.email, order.items, order.totalAmount, err => {
                    if(!err) {
                      callback(200, order)
                    } else {
                      // Error sending the email through Mailgun
                      callback(500, {'Error' : `The order email couldn't be sent to ${tokenData.email}: ${err}`})
                    }
                  })
                 } else {
                   callback(500, { 'Error': 'Could not create the new order' })
                 } 
                })
            } else {
              // Error when sending the payment to Stripe
              callback(500, {'Error' : `The payment couldn't be created for ${tokenData.email}: ${err}`})
            }})
           } else {
             // There is no cart or is empty
             callback(400, {'Error' : `A cart for the current user ${tokenData.email} doesn't exist or is empty`})
           }   
         } else {
           // Order already exists
           callback(400, {'Error' : 'An order for the current user already exists'})
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

// Orders - get
// Returns the order for the current user
orders.get = (data, callback) => {
  // Get token from headers
  const token = typeof data.headers.token == 'string' ? data.headers.token : false
  
  // Read and validate the token
  _data.read('tokens', token, (err, tokenData) => {
    if(!err && tokenData && tokenData.expires > Date.now()) {

      // Lookup the cart
      _data.read('orders', tokenData.email, (err, data) => {
        if(!err && data) {
          callback(200, data)
        } else {
          callback(404, {'Error' : 'Order not found'})
        }
      })
    } else {
      callback(403, {'Error' : 'Missing required token in header, or token is invalid'})
    }
  })
}

// Orders - put (not implemented)
orders.put = (data, callback) => {
  callback(400, {'Error' : 'Method not implemented'})
}

// Orders - delete (not implemented)
orders.delete = (data, callback) => {
  callback(400, {'Error' : 'Method not implemented'})
}

// Export the handlers for orders
module.exports = orders
