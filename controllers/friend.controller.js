const { msgConstants } = require("../helper/msgConstants");

const utils = require("../helper/utils");
const { regModel } = require("../models/regModel"); //regModel
const { friendRequestModel } = require("../models/friend.model");
const { blockUserModel } = require("../models/blockuser.model");
const { messageModel } = require("../models/message.model");
const { messageroomModel } = require("../models/messageroom.model");
const friendSchema = require("../models/friend.model");

module.exports.sendRequest = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const isUserExist = await regModel.findOne({ _id: req.params.id, verified: true, active: true });
    if (isUserExist) {
      const isBlocked = await blockUserModel.findOne({ userId: req.params.id, blockedUserId: req.user._id });
      if (!isBlocked) {
        console.log(isBlocked);
        console.log(typeof req.user._id);

        console.log(typeof req.params.id);
        if (req.params.id.toString() != req.user._id.toString()) {
          const alreadySentRequest = await friendRequestModel.findOne({
            senderId: req.user._id,
            sentTo: req.params.id,
          });
          if (!alreadySentRequest) {
            const personAlreadySentRequest = await friendRequestModel.findOne({
              senderId: req.params.id,
              sentTo: req.user._id,
            });

            if (!personAlreadySentRequest) {
              const feedObject = Object.assign({});

              feedObject["senderId"] = feedObject["senderDetails"] = req.user._id;
              feedObject["sentTo"] = feedObject["sentToUserDetails"] = req.params.id;

              await friendRequestModel(feedObject).save();
              return res.json(utils.createSuccessResponse(msgConstants.friendRequestSent));
            } else return res.json(utils.createErrorResponse(msgConstants.userAlreadySentYouRequest));
          } else return res.json(utils.createErrorResponse(msgConstants.friendRequestSentAlreadySent));
        } else return res.json(utils.createErrorResponse(msgConstants.selfRequestDenied));
      } else return res.json(utils.createErrorResponse(msgConstants.userBlockedYou));
    } else return res.json(utils.createErrorResponse(msgConstants.userNotFound));
  } else return res.json(utils.createErrorResponse(msgConstants.invalidId));
};

module.exports.cancelRequest = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const doSentRequest = await friendRequestModel.findOne({
      senderId: req.user._id,
      sentTo: req.params.id,
      active: true,
    });
    if (doSentRequest) {
      await doSentRequest.remove();
      return res.json(utils.createSuccessResponse(msgConstants.youCancelledFriendRequest));
    } else return res.json(utils.createErrorResponse(msgConstants.friendRequestNotSent));
  } else return res.json(utils.createErrorResponse(msgConstants.invalidId));
};

module.exports.sentRequestList = async (req, res) => {
  const getSentFriedRequestList = await friendRequestModel
    .find({ senderId: req.user._id, active: true })
    .select("_id accepted")
    .populate("sentToUserDetails", "name _id");
  return res.json(utils.createSuccessResponse(msgConstants.sentRequestList, getSentFriedRequestList));
};

module.exports.receivedRequestList = async (req, res) => {
  const getRecievedRequestList = await friendRequestModel
    .find({ sentTo: req.user._id, accepted: false, active: true })
    .select("_id accepted")
    .populate("senderDetails", "name");
  return res.json(utils.createSuccessResponse(msgConstants.recievedRequestList, getRecievedRequestList));
};

module.exports.acceptRequest = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const doRequested = await friendRequestModel.findOne({
      senderId: req.params.id,
      sentTo: req.user._id,
      active: true,
    });
    if (doRequested) {
      if (doRequested["accepted"] != true) {
        doRequested["accepted"] = true;
        await doRequested.save();
        return res.json(utils.createSuccessResponse(msgConstants.friendRequestAccepted));
      } else return res.json(utils.createErrorResponse(msgConstants.alreadyAcceptedFriendRequest));
    } else return res.json(utils.createErrorResponse(msgConstants.noFriendRequestPresentOfGivenAccount));
  } else return res.json(utils.createErrorResponse(msgConstants.invalidId));
};

module.exports.friendsList = async (req, res) => {
  let listOfFriends = await friendSchema.aggrFriendList(req.user._id);

  return res.json(utils.createSuccessResponse(msgConstants.allFriendsList, listOfFriends));
};

module.exports.unFriend = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const doAccountInFriendList = await friendRequestModel.findOne({
      $and: [
        { $or: [{ senderId: req.params.id }, { sentTo: req.params.id }] },
        { $or: [{ senderId: req.user._id }, { sentTo: req.user._id }] },
      ],
      accepted: true,
      active: true,
    });
    if (doAccountInFriendList) {
      const chatsBetweenThem = await messageModel.find({
        $and: [{ $or: [{ from: req.user._id }, { from: req.params.id }] }, { $or: [{ to: req.params.id }, { to: req.user._id }] }],
      });

      if (chatsBetweenThem?.length > 0) {
        await messageModel.deleteMany({
          $and: [
            { $or: [{ from: req.user._id }, { from: req.params.id }] },
            { $or: [{ to: req.params.id }, { to: req.user._id }] },
          ],
        });
        await messageroomModel.deleteMany({
          $and: [{ $or: [{ from: data.userId }, { from: data.of }] }, { $or: [{ to: data.of }, { to: data.userId }] }],
        });
      }
      await doAccountInFriendList.remove();
      return res.json(utils.createSuccessResponse(msgConstants.removedUserAsYourFriend));
    } else return res.json(utils.createErrorResponse(msgConstants.userNotInYourFriendList));
  } else return res.json(utils.createErrorResponse(msgConstants.invalidId));
};

module.exports.block = async (req, res) => {
  if (utils.isValidObjectId(req.params.id)) {
    const doAccountExist = await regModel.findOne({ _id: req.params.id, active: true });
    if (doAccountExist) {
      const alreadyBlocked = await blockUserModel.findOne({ userId: req.user._id, blockedUserId: req.params.id });
      if (!alreadyBlocked) {
        const doAccountInFriendList = await friendRequestModel.findOne({
          $and: [
            { $or: [{ senderId: req.params.id }, { sentTo: req.params.id }] },
            { $or: [{ senderId: req.user._id }, { sentTo: req.user._id }] },
          ],

          $and: [{ accepted: true }, { active: true }],
        });

        //If in friend list then remove
        if (doAccountInFriendList) {
          await doAccountInFriendList.remove();
          await blockUserModel({
            userId: req.user._id,
            blockedUserId: req.params.id,
          }).save();
          //Also delete messages from chat and remove room between them.
          await messageModel.updateMany(
            {
              $and: [
                { $or: [{ from: req.params.id }, { to: req.params.id }] },
                { $or: [{ from: req.user._id }, { to: req.user._id }] },
              ],
            },
            { $addToSet: { deletedBy: req.user._id } }
          );
          await messageroomModel.deleteOne({
            $and: [
              { $or: [{ from: req.params.id }, { to: req.params.id }] },
              { $or: [{ from: req.user._id }, { to: req.user._id }] },
            ],
          });
          return res.json(utils.createSuccessResponse(msgConstants.userHasBeenBlocked));
        } else return res.json(utils.createErrorResponse(msgConstants.userNotFound));
      } else return res.json(utils.createErrorResponse(msgConstants.alreadyBlocked));
    } else return res.json(utils.createErrorResponse(msgConstants.userNotFound));
  } else return res.json(utils.createErrorResponse(msgConstants.invalidId));
};
