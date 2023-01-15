const { msgConstants } = require("../helper/msgConstants");
const utils = require("../helper/utils");
const { postsModel } = require("../models/post.model");
const { commentModel } = require("../models/comment.model");
const { likeModel } = require("../models/like.model");
const { reportModel } = require("../models/report.model");
const { blockUserModel } = require("../models/blockuser.model");
const postSchema = require("../models/post.model");

module.exports.createPost = async (req, res) => {
  let object = Object.assign({});
  let fileTypeError = false;
  if (!req.body.title) return res.json(utils.createErrorResponse(msgConstants.titleRequired));
  object["title"] = req.body?.title;
  object["description"] = req.body?.description;
  object["userId"] = object["user"] = req.user._id;
  if (req.files?.length > 0) {
    if (req.files?.length > 5) return res.json(utils.createErrorResponse(msgConstants.numberOfPostImage));
    else
      object["media"] = req.files.map((x) => ({
        url: String(x.path).toLowerCase(),
        type: x.mimetype.includes("image") ? "image" : x.mimetype.includes("video") ? "video" : (fileTypeError = true),
      }));
  }
  if (!fileTypeError) {
    await postsModel(object).save();
    return res.json(utils.createSuccessResponse(msgConstants.postCreated));
  } else return res.json(utils.createErrorResponse(msgConstants.allowedOnlyVideoOrImage));
};

module.exports.deletePost = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const postPresence = await postsModel.findOne({ $and: [{ _id: req.params.id }, { userId: req.user._id }] });
    if (postPresence) {
      await postPresence.remove();
      return res.json(utils.createSuccessResponse(msgConstants.deletedPostSuccessfully));
    } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
  } else return res.json(utils.createErrorResponse(msgConstants.falseValidId));
};

module.exports.postList = async (req, res) => {
  const offset = req.body.offset ? Number(req.body.offset) : 0;
  const limit = req.body.limit ? Number(req.body.limit) : 10;
  // const postList = await postSchema.aggrPostList(offset, limit, req.user._id);
  const postList = await postsModel.find({}).select("title").skip(offset).limit(limit).lean();

  const toSend = {
    offset: offset + limit,
    postList: postList,
  };

  console.log(toSend.postList);

  if (toSend.postList.length <= 0) {
    return res.json(utils.createErrorResponse(msgConstants.noPostToShow));
  } else return res.json(utils.createSuccessResponse(msgConstants.postFetched, toSend));
};

module.exports.postDetails = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const postDetail = await postSchema.aggrPostDetails(req.params.id, req.user._id);
    if (postDetail.length > 0) {
      return res.json(utils.createSuccessResponse(msgConstants.fetchingPostDetails, postDetail));
    } else return res.json(utils.createErrorResponse(msgConstants.postNotFound));
  } else return res.json(utils.createErrorResponse(msgConstants.falseValidId));
};

module.exports.updatePost = async (req, res) => {
  if (utils.isValidObjectId(req.body.postId)) {
    const post = await postsModel.findOne({ userId: req.user._id, _id: req.body.postId });

    if (post) {
      for (const i of ["title", "description"]) if (req.body[i]) post[i] = req.body[i];

      let deleteArray = utils.parseToJson(req.body.delete);

      if (deleteArray && deleteArray.length > 0) {
        for (const i of deleteArray) {
          const index = post["media"].findIndex((x) => x._id.toString() == i.toString());
          delete post["media"][index];
        }

        post["media"] = post["media"].filter(Boolean);
      }

      if (req.files?.length > 0) {
        if (post["media"].length + req.files.length < 6)
          req.files.map((x) => post["media"].push({ url: x.path, type: x.mimetype.includes("image") ? "image" : "video" }));

        await post.save();
        return res.json(utils.createSuccessResponse(msgConstants.successfullyUpdatedPost, post));
      } else return res.json(utils.createErrorResponse(msgConstants.limitExceed));
    } else return res.json(utils.createErrorResponse(msgConstants.noPostFound));
  } else return res.json(utils.createErrorResponse(msgConstants.invalidPostId));
};

module.exports.postComment = async (req, res) => {
  const commentData = Object.assign({});
  if (!req.body.postId) return res.json(utils.createErrorResponse(msgConstants.providePostId));
  if (!utils.isValidObjectId(req.body.postId)) return res.json(utils.createErrorResponse(msgConstants.somethingWentWrong));
  //Post id was incorrect basically I've written according to end user
  const postPresence = await postsModel.findOne({ _id: req.body.postId });
  if (postPresence) {
    const userBlocked = await blockUserModel.findOne({ userId: postPresence["userId"], blockedUserId: req.user._id });

    if (!userBlocked) {
      const notReported = await reportModel.findOne({ postId: req.body.postId, userId: req.user._id });

      if (!notReported) {
        for (const i of ["postId", "comment"]) {
          if (!req.body[i]) return res.json(utils.createErrorResponse(`${i} is required field`));
          else commentData[i] = req.body[i];
        }
        commentData["userId"] = commentData["user"] = req.user._id;

        await commentModel(commentData).save();
        //Updating totalComments Count
        postPresence["commentsCount"] += 1;
        await postPresence.save();
        return res.json(utils.createSuccessResponse(msgConstants.commentPosted));
      } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
    } else return res.json(utils.createErrorResponse("blocked user"));
  } else return res.json(utils.createErrorResponse(msgConstants.postIsNotPresent));
};

module.exports.like = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const isPostIdTrue = await postsModel.findById({ _id: req.params.id });

    if (isPostIdTrue) {
      const userBlocked = await blockUserModel.findOne({ userId: isPostIdTrue["userId"], blockedUserId: req.user._id });

      if (!userBlocked) {
        const postReported = await reportModel.findOne({ postId: req.params.id, userId: req.user._id });
        if (!postReported) {
          const exist = await likeModel.findOne({ $and: [{ id: req.params.id }, { userId: req.user._id }] });
          if (exist) {
            if (isPostIdTrue["likesCount"] != 0) isPostIdTrue["likesCount"] -= 1;
            await isPostIdTrue.save();
            await exist.remove();
            return res.json(utils.createSuccessResponse(msgConstants.postDisliked));
          } else {
            isPostIdTrue["likesCount"] += 1;
            await isPostIdTrue.save();
            await likeModel({ id: req.params.id, userId: req.user._id, user: req.user._id }).save();
            return res.json(utils.createSuccessResponse(msgConstants.postLiked));
          }
        } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
      } else return res.json(utils.createErrorResponse("User blocked"));
    } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
  } else return res.json(utils.createErrorResponse(msgConstants.falseValidId));
};

module.exports.getComments = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    let commentData = await postSchema.aggrGetAllPostComments(req.params.id, req.user._id);
    // commentData = commentData[0];
    if (commentData) {
      return res.json(utils.createSuccessResponse(msgConstants.commentData, commentData));
    } else return res.json(utils.createErrorResponse(msgConstants.noCommentsWereFound));
  } else return res.json(utils.createErrorResponse(msgConstants.falseValidId));
};

module.exports.getLikes = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const likeData = await postSchema.aggrGetAllLikesDetail(req.params.id, req.user._id);
    if (likeData.length > 0) {
      return res.json(utils.createSuccessResponse(msgConstants.likeData, likeData));
    } else return res.json(utils.createErrorResponse(msgConstants.noLikesWereFound));
  } else return res.json(utils.createErrorResponse(msgConstants.falseValidId));
};

module.exports.report = async (req, res) => {
  if (req.body.postId) {
    if (utils.isValidObjectId(req.body.postId)) {
      const isPostPresent = await postsModel.findOne({ _id: req.body.postId });
      if (isPostPresent) {
        const alreadyReported = await reportModel.findOne({ postId: req.body.postId, userId: req.user._id });
        if (!alreadyReported) {
          const userBlocked = await blockUserModel.findOne({ userId: isPostPresent["userId"], blockedUserId: req.user._id });
          if (!userBlocked) {
            let reportObject = Object.assign({});
            reportObject["userId"] = req.user._id;
            reportObject["postId"] = req.body.postId;
            reportObject["reportMessage"] = req.body.message;
            await reportModel(reportObject).save();
            return res.json(utils.createSuccessResponse(msgConstants.reportSubmitted));
          } else return res.json(utils.createErrorResponse("user is blocked"));
        } else return res.json(utils.createErrorResponse(msgConstants.alreadyReported));
      } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
    } else return res.json(utils.createErrorResponse(msgConstants.invalidPostId));
  } else return res.json(utils.createErrorResponse(msgConstants.postIdIsRequired));
};

module.exports.share = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const postExist = await postsModel.findOne({ _id: req.params.id });
    if (postExist) {
      await postsModel({ shared: req.params.id, userId: req.user._id, user: req.user._id }).save();
      return res.json(utils.createSuccessResponse(msgConstants.postShared));
    } else return res.json(utils.createErrorResponse(msgConstants.postNotExist));
  } else return res.json(utils.createErrorResponse(msgConstants.invalidId));
};

module.exports.timeLine = async (req, res) => {
  const postList = await postSchema.aggrTimeline(req.user._id);
  if (postList) {
    return res.json(utils.createSuccessResponse("All Post", postList));
  } else return res.json(utils.createErrorResponse([]));
};
