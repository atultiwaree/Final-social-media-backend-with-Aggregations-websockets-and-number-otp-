const mongoose = require("mongoose");

const reportSchema = mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reportMessage: {
    type: String,
    default: null,
  },
});

const reportModel = mongoose.model("Report", reportSchema);
module.exports = { reportModel };
