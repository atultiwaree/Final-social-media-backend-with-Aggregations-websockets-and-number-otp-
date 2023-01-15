const mongoose = require("mongoose");
const utils = require("../helper/utils");

const likeSchema = mongoose.Schema({
  id: {
    //Post Id
    type: utils.idOfType(),
  },
  userId: {
    type: utils.idOfType(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  like: {
    type: Boolean,
    default: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const likeModel = mongoose.model("Likes", likeSchema);

module.exports = { likeModel };
