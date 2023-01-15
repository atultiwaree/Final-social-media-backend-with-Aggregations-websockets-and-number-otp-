const mongoose = require("mongoose");

const signupSchema = mongoose.Schema({
  email: {
    type: String,
    require: true,
  },
  tempMail: {
    type: String,
    defult: null,
  },
  emailChangeRequest: {
    type: Boolean,
    default: false,
  },
  emailVerify: {
    type: Boolean,
    default: false,
  },
  tempMail: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    require: true,
  },
  name: {
    type: String,
    require: true,
  },
  dob: {
    type: String,
    require: true,
  },
  profile: {
    type: String,
    require: true,
  },
  verified: {
    type: Boolean,
    default: false,
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
  active: {
    type: Boolean,
    default: false,
  },

  countryCode: {
    type: String,
    default: null,
  },

  phone: {
    type: String,
    default: null,
  },

  phoneVerify: {
    type: Boolean,
    default: false,
  },
  emailVerify: {
    type: Boolean,
    default: false,
  },
  tempPhone: {
    type: String,
    default: null,
  },

  tempCountryCode: {
    type: String,
    default: null,
  },

  changePhoneRequest: {
    type: Boolean,
    default: false,
  },

  otp: {
    type: String,
    default: null,
  },

  socketId: {
    type: String,
    default: null,
  },
});

module.exports.signupModel = mongoose.model("Signup", signupSchema);
