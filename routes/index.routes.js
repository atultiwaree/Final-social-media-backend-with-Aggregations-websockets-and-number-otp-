const express = require("express");
const routes = express.Router();

const user_routes = require("../routes/user.routes");
const post_routes = require("../routes/post.routes");
const friend_routes = require("./friend.routes");
const admin_routes = require("./admin.routes");

routes.use("/user", user_routes);
routes.use("/post", post_routes);
routes.use("/friend", friend_routes);
routes.use("/admin", admin_routes);

module.exports = routes;
