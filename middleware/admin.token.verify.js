const { msgConstants } = require("../helper/msgConstants");
const utils = require("../helper/utils");
const { adminModel } = require("../models/admin.model");

module.exports.verifyAdminToken = async (req, res, next) => {
  if (req.headers.token) {
    const tokenData = utils.verifyToken(req.headers.token);
    const prevSavedDataOfToken = await adminModel.findById(tokenData._id);
    if (prevSavedDataOfToken) {
      if (prevSavedDataOfToken.deviceId === tokenData.deviceId) {
        if (prevSavedDataOfToken.password === tokenData.password) {
          req.admin = prevSavedDataOfToken;
          next();
        } else return res.status(401).json(utils.createErrorResponse(msgConstants.sessionExpired));
      } else return res.status(401).json(utils.createErrorResponse(msgConstants.sessionExpired));
    } else return res.status(401).json(utils.createErrorResponse(msgConstants.sessionExpired));
  } else return res.json(utils.createErrorResponse(msgConstants.tokenRequired));
};

module.exports.forgetPasswordTokenDecode = async (req, res, next) => {
  if (req.headers.token) {
    const tokenData = utils.verifyToken(req.headers.token);
    req.admin = tokenData;
    next();
  } else return res.json(utils.createErrorResponse(msgConstants.tokenRequired));
};

//Just agar ham header mein token ki jagah admin_token kar dete toh conditionally status verify kar paate.
