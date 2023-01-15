const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const regModel = require("../models/regModel.js");
const mongoose = require("mongoose");
const { msgConstants } = require("./msgConstants.js");
const ObjectId = require("mongoose").Types.ObjectId;

module.exports.verifyToken = (token) => {
  try {
    return JWT.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    return false;
  }
};

module.exports.generateToken = (data) => JWT.sign(data, process.env.SECRET_KEY);

module.exports.createErrorResponse = (message, data = null, success = false) => {
  return { success, message, data };
};

module.exports.createSuccessResponse = (message, data, success = true) => {
  return { success, message, data };
};

module.exports.hashPassword = (pass) => bcrypt.hashSync(pass, Number(process.env.SALT_ROUND));

module.exports.comparePassword = (pass, hash) => bcrypt.compareSync(pass, hash);

module.exports.idOfType = () => mongoose.Schema.Types.ObjectId;

module.exports.isValidObjectId = (id) => {
  if (ObjectId.isValid(id)) {
    if (String(new ObjectId(id)) === id) return true;
    return false;
  }
  return false;
};

module.exports.toHandleMulterError = (err, req, res, next) => {
  if (err.code === "LIMIT_UNEXPECTED_FILE") return res.json({ success: false, message: msgConstants.numberOfPictureExceed });
  next();
};

module.exports.singleProfilePictureErrorHandler = (err, req, res, next) => {
  if (err) return res.json(this.createErrorResponse(msgConstants.onlySinglePictureIsRequired));
  else next();
};

module.exports.validateEmail = (mail) => {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  }
  return false;
};

module.exports.parseToJson = (string) => {
  try {
    return JSON.parse(string);
  } catch (err) {
    return false;
  }
};

module.exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};
