const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  userId: String,
  urlCode: String,
  longUrl: String,
  shortUrl: String,
  date: { type: String, default: Date.now },
  clicks: {
    total: { type: Number, default: 0 },
    byCountry: { type: Map, of: Number, default: {} },
    lastClick: {type: String, default: "Never"}
  }
});

urlSchema.methods.recordClick = function(countryCode) {
  // Increment total click count
  this.clicks.total++;
  this.clicks.lastClick = new Date().toString();
  
  // Increment click count for country
  if (countryCode) {
    if (!this.clicks.byCountry.has(countryCode)) {
      this.clicks.byCountry.set(countryCode, 0);
    }
    this.clicks.byCountry.set(countryCode, this.clicks.byCountry.get(countryCode) + 1);
  }

  // Save changes to database
  return this.save();
};

module.exports = mongoose.model("Url", urlSchema);
