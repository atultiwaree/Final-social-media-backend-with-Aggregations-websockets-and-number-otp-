const express = require("express");
const routes = express.Router();
const adminController = require("../controllers/admin.controller");
const { asyncTryCatchMiddleware } = require("../middleware/async");
const { verifyAdminToken, forgetPasswordTokenDecode } = require("../middleware/admin.token.verify");

routes.post("/login", asyncTryCatchMiddleware(adminController.login));
routes.post("/forgetpassword", asyncTryCatchMiddleware(adminController.forgetPassword));

routes.put("/resetpassword", forgetPasswordTokenDecode, asyncTryCatchMiddleware(adminController.resetpassword));
routes.put("/logout", verifyAdminToken, asyncTryCatchMiddleware(adminController.logOut));
routes.put("/changepassword", verifyAdminToken, asyncTryCatchMiddleware(adminController.changePassword));

routes.get("/assign", asyncTryCatchMiddleware(adminController.assign));
routes.get("/userlist", verifyAdminToken, asyncTryCatchMiddleware(adminController.getUsers));
routes.get("/postlist", verifyAdminToken, asyncTryCatchMiddleware(adminController.postlist));
routes.get("/userdetails", verifyAdminToken, asyncTryCatchMiddleware(adminController.userdetails));

module.exports = routes;
