const mongoose = require("mongoose");
const friendRequest = mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  senderDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  sentTo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  sentToUserDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  accepted: {
    type: Boolean,
    default: false,
  },

  active: {
    type: Boolean,
    default: true,
  },
});

module.exports.friendRequestModel = mongoose.model("Friendrequest", friendRequest);

module.exports.aggrFriendList = (userId) => {
  console.log(userId);

  const aggregationArray = [
    {
      $match: {
        $expr: {
          $and: [
            {
              $or: [{ $eq: ["$sentTo", userId] }, { $eq: ["$senderId", userId] }],
            },
            {
              $eq: ["$accepted", true],
            },
          ],
        },
      },
    },
    {
      $lookup: {
        from: "users",
        let: {
          userId: {
            $cond: [{ $eq: ["$sentTo", userId] }, "$senderId", "$sentTo"],
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$userId"],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: "friend",
      },
    },
    {
      $unwind: {
        path: "$friend",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        friend: 1,
      },
    },
  ];

  return this.friendRequestModel.aggregate(aggregationArray);
};
