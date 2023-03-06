require('dotenv').config();

var GithubStrategy = require('passport-github2').Strategy;

const gitStrat = new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://shortn.at/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      return done(null, profile);
  }
)

module.exports = gitStrat;
