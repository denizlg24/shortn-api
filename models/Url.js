const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  userId: String,
  urlCode: String,
  longUrl: String,
  shortUrl: String,
  date: { type: String, default: Date.now },
  clicks: {
    total: { type: Number, default: 0 },
    byCountry: { type: Array, of: Object, default: [] },
    byTimeOfDay: { type: Map, of: Number, default: {} },
    devices: {type: Array, of: Object, default: []},
    lastClick: {type: String, default: "Never"}
  }
});

urlSchema.methods.recordClick = function(country,device) {

  // Increment total click count
  this.clicks.total++;
  this.clicks.lastClick = new Date().toString();

  // Increment click count for country
  this.clicks.byCountry.push(country);

  //by time of dayt
  const now = new Date();
  const hour = now.getUTCHours().toString();
  if (!this.clicks.byTimeOfDay.has(hour)) {
    this.clicks.byTimeOfDay.set(hour, 0);
  }
  this.clicks.byTimeOfDay.set(hour, this.clicks.byTimeOfDay.get(hour) + 1);
  
  //by device
  this.clicks.devices.push(device);

  // Save changes to database
  return this.save();
};

module.exports = mongoose.model("Url", urlSchema);
