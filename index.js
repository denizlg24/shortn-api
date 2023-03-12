const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
require("dotenv").config();
const cors = require("cors");
const app = express();
const passport = require("passport");
const googleStrat = require("./social-auth-strategies/google-strat");
const githubStrat = require("./social-auth-strategies/github-strat");
const steamStrat = require("./social-auth-strategies/steam-strat");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const getRawBody = require('raw-body');


connectDB();
passport.use(googleStrat);
passport.use(steamStrat);
passport.use(githubStrat);

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, "dist")));

app.post('/api/subscription/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  const rawBody = await getRawBody(request);
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.WEBHOOK_SECRET_KEY);
    console.log(event);
  }
  catch (err) {
    console.log(rawBody);
    console.log(typeof(rawBody));
    response.status(400).send(`Webhook Error: ${err.message}`);
  } 

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

//Define Routes
app.use("/", require("./routes/index"));
app.use("/api/url", require("./routes/url"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/subscription", require("./routes/stripeIntegration"));

app.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "https://shortn.at" }),
  async function (req, res) {
    // Successful authentication, redirect home.
    const rawUserData = req.user._json;
    const sub = `google|${rawUserData.sub}`;
    const previousUser = await User.findOne({ sub });
    if (previousUser) {
      const accessToken = jwt.sign(
        previousUser.toJSON(),
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
      );
      res.redirect(process.env.REDIRECT_URL + accessToken);
    } else {
      try {
        const sub = `google|${rawUserData.sub}`;
        const newUser = new User({
          sub,
          displayName: rawUserData.name,
          username: rawUserData.email.split("@")[0],
          email: rawUserData.email,
          password: "Does Not Apply",
          profilePicture: rawUserData.picture,
          emailVerified: rawUserData.email_verified,
          createdAt: new Date(),
          plan: {
            subscription: "free",
            lastPaid: new Date(),
          },
        });
        await newUser.save();
        const accessToken = jwt.sign(
          newUser.toJSON(),
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "30d" }
        );
        res.redirect(process.env.REDIRECT_URL + accessToken);
      } catch (err) {
        return res.status(500).json(`Server Error: ${err}`);
      }
    }
  }
);

app.get(
  "/api/auth/github",
  passport.authenticate("github", { scope: ["user", "user:email"] })
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "https://shortn.at" }),
  async function (req, res) {
    // Successful authentication, redirect home.
    const rawUserData = req.user._json;
    const sub = `github|${rawUserData.id}`;
    const previousUser = await User.findOne({ sub });
    if (previousUser) {
      const accessToken = jwt.sign(
        previousUser.toJSON(),
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
      );
      res.redirect(process.env.REDIRECT_URL + accessToken);
    } else {
      try {
        const sub = `github|${rawUserData.id}`;
        const newUser = new User({
          sub,
          displayName: rawUserData.name,
          username: rawUserData.login,
          email: "doesnotapply@doesnotapply.doesnotapply",
          password: "Does Not Apply",
          profilePicture: rawUserData.avatar_url,
          emailVerified: true,
          createdAt: new Date(),
          plan: {
            subscription: "free",
            lastPaid: new Date(),
          },
        });
        await newUser.save();
        const accessToken = jwt.sign(
          newUser.toJSON(),
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "30d" }
        );
        res.redirect(process.env.REDIRECT_URL + accessToken);
      } catch (err) {
        return res.status(500).json(`Server Error: ${err}`);
      }
    }
  }
);

app.get(
  "/auth/steam/callback",
  passport.authenticate("steam", { failureRedirect: "https://shortn.at" }),
  async function (req, res) {
    const rawUserData = req.user._json;
    const sub = `steam|${rawUserData.steamid}`;
    const previousUser = await User.findOne({ sub });
    if (previousUser) {
      const accessToken = jwt.sign(
        previousUser.toJSON(),
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
      );
      res.redirect(process.env.REDIRECT_URL + accessToken);
    } else {
      try {
        const sub = `steam|${rawUserData.steamid}`;
        const newUser = new User({
          sub,
          displayName: rawUserData.personaname,
          username: rawUserData.personaname,
          email: "doesnotapply@doesnotapply.doesnotapply",
          password: "Does Not Apply",
          profilePicture: rawUserData.avatarfull,
          emailVerified: true,
          createdAt: new Date(),
          plan: {
            subscription: "free",
            lastPaid: new Date(),
          },
        });
        await newUser.save();
        const accessToken = jwt.sign(
          newUser.toJSON(),
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "30d" }
        );
        res.redirect(process.env.REDIRECT_URL + accessToken);
      } catch (err) {
        return res.status(500).json(`Server Error: ${err}`);
      }
    }
  }
);

app.get("/api/auth/steam", passport.authenticate("steam"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});

module.exports = app;
