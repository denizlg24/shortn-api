require("dotenv").config({ path: "../.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/create-checkout-session", async (req, res) => {
  const { sub } = req.body;
  const buyingUser = await User.findOne({ sub });
  if (!buyingUser) {
    return res.status(404).json("User not found");
  }
  const prices = await stripe.prices.list({
    lookup_keys: [req.body.lookup_key],
    expand: ["data.product"],
  });
  const session = await stripe.checkout.sessions.create({
    customer:buyingUser.stripeId.toString(),
    billing_address_collection: "auto",
    line_items: [
      {
        price: prices.data[0].id,
        quantity: 1,
      },
    ],
    subscription_data: { metadata: { sub: sub.toString() } },
    mode: "subscription",
    success_url: `${process.env.DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.DOMAIN}/?canceled=true`,
  });

  res.json({url: session.url});
});

router.post("/create-portal-session", async (req, res) => {
  // For demonstration purposes, we're using the Checkout sessio'n to retrieve the customer ID.
  // Typically this is stored alongside the authenticated user in your database.
  const { stripeId } = req.body;

  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = process.env.DOMAIN;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeId,
    return_url: returnUrl,
  });

  res.json({url: portalSession.url});
});

router.post("/webhook", async (req, res) => {
  const event = req.body;

  const subscriptionId = event.data.object.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const planId = subscription.plan.nickname;

  const stripeId = subscription.customer;

  switch (event.type) {
    case "customer.subscription.created":
      await User.updateOne(
        { stripeId },
        { $set: { plan: { subscription: planId, lastPaid: Date.now } } }
      );
      break;
    case "customer.subscription.updated":
      console.log("here updated");
      await User.updateOne(
        { stripeId },
        { $set: { plan: { subscription: planId, lastPaid: Date.now } } }
      );
      break;
    case "customer.subscription.deleted":
      console.log("here deleted");
      await User.updateOne(
        { stripeId },
        { $set: { plan: { subscription: "free", lastPaid: Date.now } } }
      );
      break;
    // Add more cases to handle other subscription events as needed
  }

  // Return a 200 OK response to acknowledge receipt of the event
  res.json({ received: true });
});

module.exports = router;
