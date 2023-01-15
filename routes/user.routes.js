const express = require("express");
const { asyncTryCatchMiddleware } = require("../middleware/async");
const { body, validationResult, check } = require("express-validator");
const utils = require("../helper/utils");
// Import controller

const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/jwtVerMid");
const routes = express.Router();

// Import middlewares

const upload = require("../helper/multer");

routes.post(
  "/register",
  upload.single("profile"),
  utils.singleProfilePictureErrorHandler,
  utils.toHandleMulterError,
  asyncTryCatchMiddleware(userController.registerController)
);
routes.get("/verify/:id", asyncTryCatchMiddleware(userController.verifyController));

routes.post("/login", asyncTryCatchMiddleware(userController.loginController));

routes.get("/getuser", verifyToken, asyncTryCatchMiddleware(userController.getUserController));

routes.post("/changepassword", verifyToken, asyncTryCatchMiddleware(userController.changePassword));

routes.post("/forgetpassword", asyncTryCatchMiddleware(userController.forgetPassword));

routes.put("/resetpassword", verifyToken, asyncTryCatchMiddleware(userController.resetPassword));

routes.get("/logout", verifyToken, asyncTryCatchMiddleware(userController.logout));

routes.put("/updateaccount", verifyToken, upload.single("profile"), asyncTryCatchMiddleware(userController.updateAccount));

routes.delete("/deleteaccount", verifyToken, asyncTryCatchMiddleware(userController.deleteAccount));

routes.put("/deactivate", verifyToken, asyncTryCatchMiddleware(userController.deActivateAccount));

routes.get("/search/:query", asyncTryCatchMiddleware(userController.searchUsers));

routes.post("/verifyaccount", asyncTryCatchMiddleware(userController.verifyAccount));

routes.post("/verifyphone", asyncTryCatchMiddleware(userController.verifyPhone));

routes.post("/sendotp", asyncTryCatchMiddleware(userController.sendOtp));

routes.post("/emailchangerequest", verifyToken, asyncTryCatchMiddleware(userController.requestEmailChange));

routes.post("/phonechangerequest", verifyToken, asyncTryCatchMiddleware(userController.requestPhoneChange));

routes.get("/verifyemail/:token", asyncTryCatchMiddleware(userController.verifyemail));

module.exports = routes;
