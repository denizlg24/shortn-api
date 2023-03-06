require('dotenv').config();

var GoogleStrategy = require('passport-google-oauth20').Strategy;

const googleStrat = new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://shortn.at/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
  }
);

module.exports = googleStrat;
