const mongoose = require("mongoose");
const blockUserSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  blockedUserId: {
    type: mongoose.Schema.Types.ObjectId,
  },
});
const blockUserModel = mongoose.model("Blockuser", blockUserSchema);
module.exports = { blockUserModel };
