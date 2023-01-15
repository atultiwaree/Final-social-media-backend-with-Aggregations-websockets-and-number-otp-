const mongoose = require("mongoose");

const regSchema = mongoose.Schema(
  {
    email: {
      type: String,
      require: true,
    },
    tempMail: {
      type: String,
      defult: null,
    },
    emailChangeRequest: {
      type: Boolean,
      default: false,
    },
    emailVerify: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      require: true,
    },
    name: {
      type: String,
      require: true,
    },
    dob: {
      type: String,
      require: true,
    },
    profile: {
      type: String,
      require: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    passwordChangeRequest: {
      type: Boolean,
      default: false,
    },
    deviceId: {
      type: String,
      default: null,
    },
    deviceModel: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      default: false,
    },

    countryCode: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      default: null,
    },

    phoneVerify: {
      type: Boolean,
      default: false,
    },
    emailVerify: {
      type: Boolean,
      default: false,
    },
    tempPhone: {
      type: String,
      default: null,
    },

    tempCountryCode: {
      type: String,
      default: null,
    },

    changePhoneRequest: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
      default: null,
    },

    socketId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports.regModel = mongoose.model("User", regSchema);

const getTotalOfFunction = (collection, field, as) => {
  return {
    from: collection,
    let: { userId: "$_id" },
    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [field, "$$userId"],
          },
        },
      },
    ],
    as: as,
  };
};

//New version....Of doing thins.

module.exports.aggrUserlist = async (userId) => {
  if (!userId) userId = {};
  else userId = { _id: userId };

  const aggregationArray = [
    {
      $match: userId,
    },

    {
      $lookup: getTotalOfFunction("comments", "$userId", "totalDidComments"),
      //for getting total comments.
    },

    {
      $lookup: getTotalOfFunction("likes", "$userId", "totalLikedBy"),
      //for getting total likes.
    },

    {
      $lookup: getTotalOfFunction("posts", "$userId", "totalPosts"),
      //for getting total posts.
    },

    {
      $lookup: {
        from: "friendrequests",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $eq: ["$senderId", "$$userId"],
                  },
                  {
                    $eq: ["$sentTo", "$$userId"],
                  },
                ],
              },
            },
          },
        ],
        as: "totalFriends",
      },
      //for getting total number of friends.
    },

    {
      $project: {
        profile: 1,
        name: 1,
        email: 1,
        totalDidComments: { $size: "$totalDidComments" },
        totalLikedBy: { $size: "$totalLikedBy" },
        totalPosts: { $size: "$totalPosts" },
        totalFriends: { $size: "$totalFriends" },
      },
    },
  ];
  return this.regModel.aggregate(aggregationArray);
};
