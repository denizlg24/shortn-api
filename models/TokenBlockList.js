const mongoose = require("mongoose");

const tokenBlockList = new mongoose.Schema({
  accessToken: String,
  deletedAt: { type: String, default: Date.now }
});

module.exports = mongoose.model("TokenBlockList", tokenBlockList);
