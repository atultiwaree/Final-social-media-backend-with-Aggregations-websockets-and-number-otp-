const utils = require("../helper/utils");
const { msgConstants } = require("../helper/msgConstants");

module.exports.asyncTryCatchMiddleware = (handler) => {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.log("::::caught inside error::::::::", err.message, err.stack);
      return res
        .status(400)
        .json(utils.createErrorResponse(msgConstants.somethingWentWrong));
    }
  };
};
