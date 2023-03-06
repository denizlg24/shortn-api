require('dotenv').config();

var FacebookStrategy = require('passport-facebook').Strategy;

const facebookStrat = new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://shortn.at/auth/facebook/callback",
    enableProof: true 
  },
  function(accessToken, refreshToken, profile, cb) {
      return cb(null, profile);
  }
)

module.exports = facebookStrat;
