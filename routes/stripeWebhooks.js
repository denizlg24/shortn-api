const stripe = require("stripe")(process.env.STRIPE_SECRET);
const express = require("express");
const router = express.Router();
require("dotenv").config();

router.post("/webhook", express.raw(), (request, response) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.WEBHOOK_SECRET_KEY
    );
    console.log(event);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  console.log(`Unhandled event type ${event.type}`);

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});
