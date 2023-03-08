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

  const browserKey = browser.replace(/\./g, '');
  const osKey = os.replace(/\./g, '');
  const deviceKey = device.replace(/\./g, '');


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
  if (!this.clicks.byBrowser.has(browserKey)) {
    this.clicks.byBrowser.set(browserKey, 0);
  }
  this.clicks.byBrowser.set(browserKey, this.clicks.byBrowser.get(browserKey) + 1);

  //by osKey
  if (!this.clicks.byOperatingSystem.has(osKey)) {
    this.clicks.byOperatingSystem.set(osKey, 0);
  }
  this.clicks.byOperatingSystem.set(osKey, this.clicks.byOperatingSystem.get(osKey) + 1);

  //by deviceKey
  if (!this.clicks.byDevice.has(deviceKey)) {
    this.clicks.byDevice.set(deviceKey, 0);
  }
  this.clicks.byDevice.set(deviceKey, this.clicks.byDevice.get(deviceKey) + 1);

  // Save changes to database
  return this.save();
};

module.exports = mongoose.model("Url", urlSchema);
