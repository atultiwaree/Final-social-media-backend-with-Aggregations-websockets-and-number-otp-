const utils = require("../helper/utils");
const { regModel } = require("../models/regModel");
const { msgConstants } = require("../helper/msgConstants");

const verifyToken = async (req, res, next) => {
  if (req.headers.token) {
    let tokenDetails = utils.verifyToken(req.headers.token);

    if (tokenDetails) {
      let userDetails = await regModel.findOne({ _id: tokenDetails._id });
      if (userDetails) {
        if (userDetails.password == tokenDetails.password) {
          if (userDetails.deviceId == tokenDetails.deviceId) {
            req.user = userDetails;
            next();
          } else return res.status(401).json(utils.createErrorResponse(msgConstants.sessionExpired));
        } else return res.status(401).json(utils.createErrorResponse(msgConstants.sessionExpired));
      } else return res.status(401).json(utils.createErrorResponse(msgConstants.sessionExpired));
    } else return res.status(401).json(utils.createErrorResponse(msgConstants.sessionExpired));
  } else return res.status(401).json(utils.createErrorResponse(msgConstants.tokenRequired));
};

module.exports = { verifyToken };
