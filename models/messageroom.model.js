const mongoose = require("mongoose");

const chatlistSchema = mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "User",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "User",
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

const messageroomModel = mongoose.model("Messageroom", chatlistSchema);

module.exports = { messageroomModel };
