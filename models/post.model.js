const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const postsSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
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
    active: {
      type: Boolean,
      default: true,
    },
    shared: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports.postsModel = mongoose.model("Posts", postsSchema);

//::::::::::::::::::::: Utility Functions :::::::::::::::::::::

const getSelfLike = (likeDocsArray, userId) => {
  return {
    $gt: [
      {
        $size: {
          $filter: {
            input: likeDocsArray,
            as: "likeDocs",
            cond: { $eq: ["$$likeDocs.user", userId] },
          },
        },
      },
      0,
    ],
  };
};

//:::::::::::::::::::: Utility Function close :::::::::::::::::::
//Aggregation...

module.exports.aggrPostList = (offset, limit, userId) => {
  let aggregationArray = [
    //For checking if user blocked the pos

    //For getting user details
    {
      $lookup: {
        from: "users",
        let: { user: "$user" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$user"],
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
        as: "user",
      },
    },
    //For number of likes
    {
      $lookup: {
        from: "likes",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$id", "$$postId"],
              },
            },
          },
        ],
        as: "totalLikes",
      },
    },
    //For number of comments
    {
      $lookup: {
        from: "comments",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$postId", "$$postId"],
              },
            },
          },
        ],
        as: "totalComments",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    //If post reported it won't show to the reported by user.
    {
      $lookup: {
        from: "reports",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$userId", userId] }, { $eq: ["$postId", "$$postId"] }],
              },
            },
          },
        ],
        as: "blockedPost",
      },
    },
    {
      $unwind: {
        path: "$blockedPost",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "blockusers",
        let: { postOfUserId: "$userId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $and: [{ $eq: ["$userId", "$$postOfUserId"] }, { $eq: ["$blockedUserId", userId] }] },
                  { $and: [{ $eq: ["$userId", userId] }, { $eq: ["$blockedUserId", "$$postOfUserId"] }] },
                ],
              },
            },
          },
        ],
        as: "blockedUsersPost",
      },
    },
    {
      $unwind: {
        path: "$blockedUsersPost",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $expr: {
          $and: [
            { $and: [{ $ne: ["$userId", "$blockedUsersPost.blockedUserId"] }, { $ne: [userId, "$blockedUsersPost.userId"] }] },
            { $and: [{ $ne: ["$userId", "$blockedUsersPost.userId"] }, { $ne: [userId, "$blockedUsersPost.blockedUserId"] }] },
            { $ne: ["$_id", "$blockedPost.postId"] },
          ],
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        _id: 1,
        user: 1,
        userId: 1,
        description: 1,
        media: 1,
        title: 1,
        totalLikes: { $size: "$totalLikes" },
        totalComments: { $size: "$totalComments" },
        selfLike: getSelfLike("$totalLikes", userId),
        blockedUsersPost: 1,
      },
    },
  ];
  return this.postsModel.aggregate(aggregationArray);
};

module.exports.aggrPostDetails = (postId, userId) => {
  postId = ObjectId(postId);
  const aggregationArray = [
    {
      $lookup: {
        from: "users",
        let: { postOfUserId: "$user" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$postOfUserId"],
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
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "likes",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$id", "$$postId"],
              },
            },
          },
        ],
        as: "likesCount",
      },
    },
    {
      $lookup: {
        from: "comments",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$postId", "$$postId"],
              },
            },
          },
        ],
        as: "commentsCount",
      },
    },
    {
      $lookup: {
        from: "reports",
        let: { wathingUserId: userId, postId: postId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$postId", "$$postId"] }, { $eq: ["$userId", "$$wathingUserId"] }],
              },
            },
          },
        ],
        as: "reportedPost",
      },
    },
    {
      $unwind: {
        path: "$reportedPost",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "blockusers",
        let: { postUserId: "$user._id", watchingUserId: userId },

        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $and: [{ $eq: ["$userId", "$$watchingUserId"] }, { $eq: ["$blockedUserId", "$$postUserId"] }] },
                  { $and: [{ $eq: ["$userId", "$$postUserId"] }, { $eq: ["$blockedUserId", "$$watchingUserId"] }] },
                ],
              },
            },
          },
        ],
        as: "blockedUser",
      },
    },
    {
      $unwind: {
        path: "$blockedUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $expr: {
          $and: [
            { $and: [{ $ne: ["$blockedUser.userId", userId] }, { $ne: ["$blockedUser.blockedUserId", "$user._id"] }] },
            { $and: [{ $ne: ["$blockedUser.userId", "$user._id"] }, { $ne: ["$blockedUser.blockedUserId", userId] }] },
            { $ne: ["$_id", "$reportedPost.postId"] },
          ],
        },
      },
    },
    {
      $match: {
        _id: ObjectId(postId),
      },
    },
    {
      $project: {
        user: 1,
        title: 1,
        description: 1,
        media: 1,
        testField: 1,
        likesCount: { $size: "$likesCount" },
        commentsCount: { $size: "$commentsCount" },
        reportedPost: 1,
        blockedUser: 1,
        selfLike: getSelfLike("$likesCount", userId),
      },
    },
  ];
  return this.postsModel.aggregate(aggregationArray);
};

module.exports.aggrGetAllLikesDetail = (postId, userId) => {
  postId = ObjectId(postId);
  const aggregationArray = [
    {
      $match: { _id: postId },
    },
    //Checking If Creator of post has not blocked the user.
    {
      $lookup: {
        from: "blockusers",
        let: { postOfUserId: "$user", wathingUserId: userId },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      {
                        $eq: ["$userId", "$$postOfUserId"],
                      },
                      {
                        $eq: ["$blockedUserId", "$$wathingUserId"],
                      },
                    ],
                  },
                  {
                    $and: [
                      {
                        $eq: ["$userId", "$$wathingUserId"],
                      },
                      {
                        $eq: ["$blockedUserId", "$$postOfUserId"],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: "blockShowingPost",
      },
    },
    {
      $unwind: {
        path: "$blockShowingPost",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $expr: {
          $and: [
            {
              $or: [
                {
                  $ne: ["$blockShowingPost.userId", userId],
                },
                {
                  $ne: ["$blockShowingPost.blockedUserId", "$user"],
                },
              ],
            },
            {
              $and: [
                {
                  $ne: ["$blockShowingPost.userId", "$user"],
                },
                {
                  $ne: ["$blockShowingPost.blockedUserId", userId],
                },
              ],
            },
          ],
        },
      },
    },
    // Get all likes from like collection
    {
      $lookup: {
        from: "likes",
        let: { postId: postId },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$id", "$$postId"],
              },
            },
          },
          {
            $project: {
              user: 1,
              like: 1,
              _id: 0,
            },
          },
        ],
        as: "likes",
      },
    },
    {
      $unwind: {
        path: "$likes",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        let: { likedUserId: "$likes.user" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$likedUserId"],
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
        as: "likedByUser",
      },
    },
    {
      $unwind: {
        path: "$likedByUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    //user who blocked viewing user won't see their like.
    {
      $lookup: {
        from: "blockusers",
        let: { watchingUserId: userId, commentByUserId: "$likedByUser._id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      {
                        $eq: ["$userId", "$$commentByUserId"],
                      },
                      {
                        $eq: ["$blockedUserId", "$$watchingUserId"],
                      },
                    ],
                  },
                  {
                    $and: [
                      {
                        $eq: ["$userId", "$$watchingUserId"],
                      },
                      {
                        $eq: ["$blockedUserId", "$$commentByUserId"],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: "blockedUser",
      },
    },
    {
      $unwind: {
        path: "$blockedUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $expr: {
          $and: [
            {
              $and: [
                {
                  $ne: ["$blockedUser.userId", userId],
                },
                {
                  $ne: ["$blockedUser.blockedUserId", "$likedByUser._id"],
                },
              ],
            },
            {
              $and: [
                {
                  $ne: ["$blockedUser.userId", "$likedByUser._id"],
                },
                {
                  $ne: ["$blockedUser.blockedUserId", userId],
                },
              ],
            },
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        likedByUser: 1,
        "likes.like": 1,
        blockedUser: 1,
        postCreatorBlocked: 1,
        user: 1,
        blockShowingPost: 1,
      },
    },
  ];
  return this.postsModel.aggregate(aggregationArray);
};

//It has problem of nested objects...

module.exports.aggrGetAllPostComments = (postId, userId) => {
  postId = ObjectId(postId);
  const aggregationArray = [
    {
      $match: {
        $expr: {
          $eq: ["$_id", postId],
        },
      },
    },

    //either of them blocked each

    {
      $lookup: {
        from: "blockusers",
        let: { postCreatorId: "$user" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $and: [{ $eq: ["$userId", "$$postCreatorId"] }, { $eq: ["$blockedUserId", userId] }] },
                  { $and: [{ $eq: ["$userId", userId] }, { $eq: ["$blockedUserId", "$$postCreatorId"] }] },
                ],
              },
            },
          },
        ],
        as: "blockedUser",
      },
    },
    {
      $unwind: {
        path: "$blockedUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    // {
    //   $match: {
    //     $expr: {
    //       $and: [
    //         {
    //           $and: [
    //             {
    //               $ne: ["$blockedUser.userId", userId],
    //             },
    //             {
    //               $ne: ["$blockedUser.blockedUserId", "$user"],
    //             },
    //           ],
    //         },
    //         {
    //           $and: [
    //             {
    //               $ne: ["$blockedUser.userId", "$user"],
    //             },
    //             {
    //               $ne: ["$blockedUser.blockedUserId", userId],
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   },
    // },

    //Reported Post

    {
      $lookup: {
        from: "reports",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$postId", postId] }, { $eq: ["$userId", userId] }],
              },
            },
          },
        ],
        as: "reportedPost",
      },
    },
    {
      $unwind: {
        path: "$reportedPost",
        preserveNullAndEmptyArrays: true,
      },
    },
    // {
    //   $match: {
    //     $expr: {
    //       $and: [{ $ne: ["$reportedPost.postId", postId] }, { $ne: ["$reportedPost.userId", userId] }],
    //     },
    //   },
    // },

    //Gettig comments

    {
      $lookup: {
        from: "comments",
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$postId", postId],
              },
            },
          },
          {
            $project: {
              user: 1,
              comment: 1,
              // userId: 1,
              _id: 0,
            },
          },
          {
            $lookup: {
              from: "users",
              let: { commentByUserId: "$user" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$_id", "$$commentByUserId"],
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
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
        as: "comment",
      },
    },
    {
      $unwind: {
        path: "$comment",
        preserveNullAndEmptyArrays: true,
      },
    },
    // don't show comments to either of blocked users.
    {
      $lookup: {
        from: "blockusers",
        let: { commentByUserId: "$comment.user._id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      {
                        $eq: ["$userId", "$$commentByUserId"],
                      },
                      {
                        $eq: ["$blockedUserId", userId],
                      },
                    ],
                  },
                  {
                    $and: [
                      {
                        $eq: ["$userId", userId],
                      },
                      {
                        $eq: ["$blockedUserId", "$$commentByUserId"],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: "blockInfo",
      },
    },

    {
      $unwind: {
        path: "$blockInfo",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $match: {
        $expr: {
          $and: [
            // don't show comments to either of blocked users.

            {
              $and: [
                {
                  $ne: ["$blockInfo.userId", "$comment.user._id"],
                },
                {
                  $ne: ["$blockInfo.blockedUserId", userId],
                },
              ],
            },
            {
              $and: [
                {
                  $ne: ["$blockInfo.userId", userId],
                },
                {
                  $ne: ["$blockInfo.blockedUserId", "$comment.user._id"],
                },
              ],
            },
            //Since blocked don't show each other's post.
            {
              $and: [
                {
                  $ne: ["$blockedUser.userId", userId],
                },
                {
                  $ne: ["$blockedUser.blockedUserId", "$user"],
                },
              ],
            },
            {
              $and: [
                {
                  $ne: ["$blockedUser.userId", "$user"],
                },
                {
                  $ne: ["$blockedUser.blockedUserId", userId],
                },
              ],
            },
            //Post is reported and hence don't show any post details.
            {
              $and: [{ $ne: ["$reportedPost.postId", postId] }, { $ne: ["$reportedPost.userId", userId] }],
            },
          ],
        },
      },
    },

    //Projection
    {
      $project: {
        _id: 0,
        comment: 1,
      },
    },
  ];
  return this.postsModel.aggregate(aggregationArray);
};

module.exports.aggrTimeline = (userId) => {
  console.log(userId);
  const aggregationArray = [
    {
      $match: {
        $expr: {
          $eq: ["$userId", userId],
        },
      },
    },
    {
      $lookup: {
        from: "posts",
        let: { postId: "$shared" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$postId"],
              },
            },
          },
          {
            $lookup: {
              from: "users",
              let: { userId: "$user" },
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
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              user: 1,
              title: 1,
              description: 1,
              media: 1,
            },
          },
        ],

        as: "shared",
      },
    },
    {
      $unwind: {
        path: "$shared",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        let: { userId: "$user" },
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
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 1,
        user: 1,
        title: 1,
        description: 1,
        shared: 1,
        media: {
          $cond: {
            if: "$shared",
            then: null,
            else: "$media",
          },
        },
      },
    },
  ];
  return this.postsModel.aggregate(aggregationArray);
};

module.exports.aggrForAdminPostList = async () => {
  const aggregationArray = [
    {
      $project: {
        _id: 1,
        user: 1,
        title: 1,
        description: 1,
        media: 1,
      },
    },
  ];
  return this.postsModel.aggregate(aggregationArray);
};
