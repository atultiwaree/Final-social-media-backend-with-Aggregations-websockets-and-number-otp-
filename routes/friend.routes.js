const express = require("express");

const { asyncTryCatchMiddleware } = require("../middleware/async");

const utils = require("../helper/utils");

const routes = express.Router();

const controller = require("../controllers/friend.controller");

const upload = require("../helper/multer");

const { verifyToken } = require("../middleware/jwtVerMid");

routes.get("/request/:id", verifyToken, asyncTryCatchMiddleware(controller.sendRequest));

routes.get("/cancelrequest/:id", verifyToken, asyncTryCatchMiddleware(controller.cancelRequest));

routes.get("/sentrequestlist", verifyToken, asyncTryCatchMiddleware(controller.sentRequestList));

routes.get("/receivedrequestlist", verifyToken, asyncTryCatchMiddleware(controller.receivedRequestList));

routes.get("/acceptrequest/:id", verifyToken, asyncTryCatchMiddleware(controller.acceptRequest));

routes.get("/list", verifyToken, asyncTryCatchMiddleware(controller.friendsList));

routes.get("/unfriend/:id", verifyToken, asyncTryCatchMiddleware(controller.unFriend));

routes.get("/block/:id", verifyToken, asyncTryCatchMiddleware(controller.block));

module.exports = routes;
