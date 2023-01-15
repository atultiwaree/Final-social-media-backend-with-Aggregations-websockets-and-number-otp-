const utils = require("../helper/utils");
const { msgConstants } = require("../helper/msgConstants");
const { adminModel } = require("../models/admin.model");
const { aggrUserlist } = require("../models/regModel");
const { aggrForAdminPostList } = require("../models/post.model");
const sendMail = require("../mail/index.js");
const mailBody = require("../html/email.body");
const { ObjectId } = require("mongodb");

module.exports.assign = (req, res) => {
  adminModel({ email: "2010344.bca.cbsa@cgc.edu.in", password: utils.hashPassword("pass") })
    .save()
    .catch((err) => err.message);
  return res.json(utils.createSuccessResponse(msgConstants.assign_admin));
};

module.exports.login = async (req, res) => {
  for (const i of ["email", "password"])
    if (!req.body[i]) return res.json(utils.createErrorResponse(i + msgConstants.requiredHolder));

  if (utils.validateEmail(req.body.email)) {
    const dataOfEmail = await adminModel.findOne({ email: req.body.email });
    if (dataOfEmail) {
      if (utils.comparePassword(req.body.password, dataOfEmail.password)) {
        //Creating authorizaiton tokens...
        dataOfEmail["deviceId"] = req.body?.deviceId;
        dataOfEmail["deviceModel"] = req.body?.deviceModel;
        dataOfEmail.save().catch((err) => console.log(err.message));
        const token = utils.generateToken({
          _id: dataOfEmail._id,
          password: dataOfEmail.password,
          deviceId: req.body.deviceId,
        });
        return res.json(utils.createSuccessResponse(msgConstants.successfullyLoggedIn, { token }));
      } else return res.json(utils.createErrorResponse(msgConstants.passwordIsNotCorrect));
    } else return res.json(utils.createErrorResponse(msgConstants.wrongEmailAddress));
  } else return res.json(utils.createErrorResponse(msgConstants.notValidEmail));
};

module.exports.logOut = async (req, res) => {
  const admin = req.admin;
  admin["deviceId"] = null;
  admin["deviceModel"] = null;
  admin.save().catch((err) => res.json({ err }));
  return res.json(utils.createErrorResponse(msgConstants.logout));
};

module.exports.forgetPassword = async (req, res) => {
  if (req.body.email) {
    const isEmailExist = await adminModel.findOne({ email: req.body.email });
    if (isEmailExist) {
      const updatePasswordRequest = await adminModel.updateOne({ email: isEmailExist.email }, { passwordChangeRequest: true });
      console.log("::::Sent Date::::", Date.now() + 600);
      if (updatePasswordRequest) {
        sendMail(
          req.body.email,
          "Change Admin passwor d",
          mailBody.fgMail(
            utils.generateToken({
              _id: isEmailExist._id,
              mailExpiry: Date.now() + 600000,
            }),
            "Click to change"
          )
        );
        return res.json(utils.createSuccessResponse(msgConstants.forgetPasswordMailSent));
      } else return res.json(utils.createErrorResponse(msgConstants.somethingWentWrong));
    } else return res.json(utils.createErsrorResponse(msgConstants.wrongEmail));
  } else return res.json(utils.createErrorResponse(msgConstants.provideEmail));
};

module.exports.resetpassword = async (req, res) => {
  if (req.body.newpassword) {
    if (req.admin._id) {
      const requestForPasswordChange = await adminModel.findById(req.admin._id);
      console.log("::::Recieved Date::::", Date.now());
      if (Date.now() < req.admin.mailExpiry) {
        if (requestForPasswordChange.passwordChangeRequest) {
          requestForPasswordChange["passwordChangeRequest"] = false;

          requestForPasswordChange["password"] = utils.hashPassword(req.body.newpassword);
          requestForPasswordChange.save();

          return res.json(utils.createSuccessResponse(msgConstants.passwordChanged));
        } else return res.json(utils.createErrorResponse(msgConstants.unauthorizedChage));
      } else return res.json(utils.createErrorResponse(msgConstants.mailExpired));
    } else return res.json(utils.createErrorResponse(msgConstants.sessionExpired));
  } else return res.json(utils.createErrorResponse(msgConstants.provideNewPassword));
};

module.exports.changePassword = async (req, res) => {
  for (const i of ["oldPassword", "newPassword"])
    if (!req.body[i]) return res.json(utils.createErrorResponse(msgConstants.pp + ` ${i}`));

  let admin = req.admin;

  if (utils.comparePassword(req.body.oldPassword, admin.password)) {
    admin["password"] = utils.hashPassword(req.body.newPassword);
    await admin.save();

    return res.json(utils.createSuccessResponse(msgConstants.passwordChanged));
  } else return res.json(utils.createErrorResponse(msgConstants.wrongOldPassword));
};

module.exports.getUsers = async (req, res) => {
  const usersList = await aggrUserlist();
  return res.json(utils.createSuccessResponse(msgConstants.listOfUsers, usersList));
};

module.exports.postlist = async (req, res) => {
  const postlist = await aggrForAdminPostList();
  return res.json(utils.createSuccessResponse(msgConstants.listAllPost, postlist));
};

module.exports.userdetails = async (req, res) => {
  if (!req.body.userId) return res.json(utils.createErrorResponse(msgConstants.provideUserId));
  const userDetails = await aggrUserlist(ObjectId(req.body.userId));
  return res.json(utils.createSuccessResponse(msgConstants.listOfUsers, userDetails));
};
