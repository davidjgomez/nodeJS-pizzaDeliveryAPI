# Pizza Delivery API
A Pizza Delivery API that lets user order different items from a predefined list

## Requirements

1. New users can be created, their information can be edited, and they can be deleted. We should store their name, email address, and street address.
2. Users can log in and log out by creating or destroying a token.
3. When a user is logged in, they should be able to GET all the possible menu items (these items can be hardcoded into the system).
4. A logged-in user should be able to fill a shopping cart with menu items
5. A logged-in user should be able to create an order. You should integrate with the Sandbox of Stripe.com to accept their payment. Note: Use the stripe sandbox for your testing. Follow this link and click on the "tokens" tab to see the fake tokens you can use server-side to confirm the integration is working: https://stripe.com/docs/testing#cards
6. When an order is placed, you should email the user a receipt. You should integrate with the sandbox of Mailgun.com for this. Note: Every Mailgun account comes with a sandbox email account domain (whatever@sandbox123.mailgun.org) that you can send from by default. So, there's no need to setup any DNS for your domain for this task https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account

## Solution instructions

1. A new user should be created using the _CreateUser_ endpoint
2. Once the user is created, a new Token can be created using the _CreateToken_ endpoint
3. Next, items, carts and orders can be created as desired
4. Please take into account that the environment variables for __Mailgun__ and __Stripe__ shpuld be added for staginf and production in the _config.js_ file.

For every endpoint there are examples of successful and failed requests in the [Pizza Delivery Test Collection](Pizza%20Delivery%20API.postman_collection.json)
