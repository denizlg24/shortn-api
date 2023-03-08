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
    byTimeOfDay: { type: Map, of: Number, default: {} },
    byBrowser: { type: Map, of: Number, default: {} },
    byOperatingSystem: { type: Map, of: Number, default: {} },
    byDevice: { type: Map, of: Number, default: {} },
    lastClick: {type: String, default: "Never"}
  }
});

urlSchema.methods.recordClick = function(countryCode,browser,os,device) {
  // Increment total click count
  this.clicks.total++;
  this.clicks.lastClick = new Date().toString();
  
  // Increment click count for country
    if (!this.clicks.byCountry.has(countryCode)) {
      this.clicks.byCountry.set(countryCode, 0);
    }
    this.clicks.byCountry.set(countryCode, this.clicks.byCountry.get(countryCode) + 1);

  //by time of dayt
  const now = new Date();
  const hour = now.getUTCHours().toString();
  if (!this.clicks.byTimeOfDay.has(hour)) {
    this.clicks.byTimeOfDay.set(hour, 0);
  }
  this.clicks.byTimeOfDay.set(hour, this.clicks.byTimeOfDay.get(hour) + 1);
  
  //by browser
  if (!this.clicks.byBrowser.has(browser)) {
    this.clicks.byBrowser.set(browser, 0);
  }
  this.clicks.byBrowser.set(browser, this.clicks.byBrowser.get(browser) + 1);

  //by os
  if (!this.clicks.byOperatingSystem.has(os)) {
    this.clicks.byOperatingSystem.set(os, 0);
  }
  this.clicks.byOperatingSystem.set(os, this.clicks.byOperatingSystem.get(os) + 1);

  //by device
  if (!this.clicks.byDevice.has(device)) {
    this.clicks.byDevice.set(device, 0);
  }
  this.clicks.byDevice.set(device, this.clicks.byDevice.get(device) + 1);

  // Save changes to database
  return this.save();
};

module.exports = mongoose.model("Url", urlSchema);
