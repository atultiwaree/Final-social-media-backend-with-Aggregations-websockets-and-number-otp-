const express = require("express");
const { asyncTryCatchMiddleware } = require("../middleware/async");
const utils = require("../helper/utils");
const routes = express.Router();
const controller = require("../controllers/post.controller");
const upload = require("../helper/multer");
const { verifyToken } = require("../middleware/jwtVerMid");

routes.post("/create", verifyToken, upload.array("media"), asyncTryCatchMiddleware(controller.createPost));

routes.delete("/delete/:id", verifyToken, asyncTryCatchMiddleware(controller.deletePost));

routes.get("/list", verifyToken, asyncTryCatchMiddleware(controller.postList));

routes.get("/details/:id", verifyToken, asyncTryCatchMiddleware(controller.postDetails));

routes.put("/update", verifyToken, upload.array("media"), asyncTryCatchMiddleware(controller.updatePost));

routes.post("/comment", verifyToken, asyncTryCatchMiddleware(controller.postComment));

routes.get("/like/:id", verifyToken, asyncTryCatchMiddleware(controller.like));

routes.post("/report", verifyToken, asyncTryCatchMiddleware(controller.report));

routes.get("/getcomments/:id", verifyToken, asyncTryCatchMiddleware(controller.getComments));

routes.get("/getlikes/:id", verifyToken, asyncTryCatchMiddleware(controller.getLikes));

routes.get("/timeline", verifyToken, asyncTryCatchMiddleware(controller.timeLine));

routes.get("/share/:id", verifyToken, asyncTryCatchMiddleware(controller.share));

module.exports = routes;
