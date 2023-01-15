const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    message: {
      type: String,
      default: null,
    },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId }],
    isSeen: {
      type: Boolean,
      default: false,
    },
    media: [
      {
        type: {
          type: String,
          default: null,
        },
        url: {
          type: String,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

const messageModel = mongoose.model("Message", messageSchema);
module.exports = { messageModel };
