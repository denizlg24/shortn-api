var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * User Schema
 */
var userSchema = new Schema({
  sub: {
    type: String,
    required: true,
    default: "",
    unique: [true, "idk anymore"],
  },
  displayName: {
    type: String,
    required: true,
    default: "",
  },
  stripeId : {
    type: String,
    required: true,
    default: "",
  },
  username: {
    type: String,
    required: [true, "username not provided "],
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, "email not provided"],
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: "{VALUE} is not a valid email!",
    },
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: "",
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  plan: {
    type: Object,
    default: {
      subscription: "free",
      lastPaid: Date.now,
    },
  },
  links_this_month: {
    type: Number,
    default: 0,
  }
});

module.exports = mongoose.model("User", userSchema);
