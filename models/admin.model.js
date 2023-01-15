const mongoose = require("mongoose");
const { regModel } = require("../models/regModel");

const adminSchema = mongoose.Schema({
  email: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    default: null,
  },
  passwordChangeRequest: {
    type: Boolean,
    default: false,
  },
  deviceId: {
    type: String,
    default: null,
  },
  deviceModel: {
    type: String,
    default: null,
  },
});

module.exports.adminModel = mongoose.model("Admin", adminSchema);
