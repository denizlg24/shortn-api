require("dotenv").config({path:'../.env'});
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
    billing_address_collection: "auto",
    line_items: [
      {
        price: prices.data[0].id,
        // For metered billing, do not pass quantity
        quantity: 1,
      },
    ],
    metadata: {
      sub,
    },
    mode: "subscription",
    success_url: `${process.env.DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.DOMAIN}/?canceled=true`,
  });

  res.redirect(session.url);
});

router.post("/create-portal-session", async (req, res) => {
  // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
  // Typically this is stored alongside the authenticated user in your database.
  const { session_id } = req.body;
  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = process.env.DOMAIN;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: checkoutSession.customer,
    return_url: returnUrl,
  });

  res.redirect(303, portalSession.url);
});

router.post("/webhook", async (req, res) => {
  const event = req.body;

  switch (event.type) {
    case "customer.subscription.created":
      const newsubscriptionId = event.data.object.id;

      const newsubscription = await stripe.subscriptions.retrieve(newsubscriptionId);

      const newplanId = newsubscription.plan.id;

      const newsub = newsubscription.metadata.sub;
      console.log(`newSubscriptionId: ${newsubscriptionId}, newSubscriptionMetadata: ${newsubscription.metadata}`)
      console.log(newsub);
      console.log("here created");
      await User.updateOne(
        { sub:newsub },
        { $set: { plan: { subscription: newplanId, lastPaid: Date.now } } }
      );
      break;
    case "customer.subscription.updated":
      const subscriptionId = event.data.object.id;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const planId = subscription.plan.id;

      const sub = subscription.metadata.sub;
      console.log(sub);
      console.log("here updated");
      await User.updateOne(
        { sub },
        { $set: { plan: { subscription: planId, lastPaid: Date.now } } }
      );
      break;
    case "customer.subscription.deleted":
      const deletedSubscriptionId = event.data.object.id;
      const deletedSubscription = await stripe.subscriptions.retrieve(deletedSubscriptionId);
      const deletedSub = deletedSubscription.metadata.sub;
      console.log(deletedSub);
      console.log("here deleted");
      await User.updateOne(
        { sub:deletedSub },
        { $set: { plan: { subscription: "free", lastPaid: Date.now } } }
      );
      break;
    // Add more cases to handle other subscription events as needed
  }

  // Return a 200 OK response to acknowledge receipt of the event
  res.json({ received: true });
});

module.exports = router;
