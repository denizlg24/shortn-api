require('dotenv').config();

const SteamStrategy = require('passport-steam').Strategy;

const steamStrat = new SteamStrategy({
    returnURL: 'https://shortn.at/auth/steam/callback',
    realm: 'https://shortn.at/',
    apiKey: process.env.STEAM_API_KEY,
  },
  function(identifier, profile, cb) {
      return cb(null, profile);
  }
)

module.exports = steamStrat;
