const { msgConstants } = require("../helper/msgConstants");
const { socketConstants } = require("../helper/socket.constants");
const { createSuccessResponse, createErrorResponse } = require("../helper/utils");
const { regModel } = require("../models/regModel");
const { messageModel } = require("../models/message.model");
const { messageroomModel } = require("../models/messageroom.model");
const { blockUserModel } = require("../models/blockuser.model");
const { friendRequestModel } = require("../models/friend.model");
const utils = require("../helper/utils");

//to get count of all unseen messages.
const handleUnSeenMessageCount = async (from, to) => {
  console.log(from, to);
  return messageModel.find({ from, to, isSeen: false }).count();
};

//to send room list along with unseen message when first initilized and while sending message.
const getMessageRoomList = async (data) => {
  const newlist = [];
  const list = await messageroomModel
    .find({ $or: [{ from: data.userId }, { to: data.userId }] })
    .sort("-updatedAt")
    .populate("message to from", "name message")
    .select(" -createdAt -updatedAt -__v -_id")
    .lean();
  for (const i of list) {
    if (i.from._id.toString() === data.userId?.toString()) {
      delete i.from;
      i.user = i.to;
      delete i.to;
      newlist.push(i);
    } else {
      i.totalUnseenMessage = await handleUnSeenMessageCount(i.from, i.to);
      delete i.to;
      i.user = i.from;
      delete i.from;
      newlist.push(i);
    }
  }
  return newlist;
};

const checkIfLoggedIn = async (socketId) => {
  return regModel.findOne({ socketId: socketId });
};

module.exports.handleLogin = async (data, socket, io) => {
  console.log("login socket Id ", socket.id);
  const userExist = await regModel.findById({ _id: data.userId });
  const socketId = socket.id;
  if (userExist) {
    userExist["socketId"] = socketId;
    await userExist.save();
    io.to(socketId).emit(socketConstants.success, createSuccessResponse(msgConstants.socketConnected));
  } else io.to(socketId).emit(socketConstants.error, createErrorResponse(msgConstants.userNotFound));
};

module.exports.handleMessage = async (data, socket, io) => {
  if (checkIfLoggedIn(socket.id)) {
    const isFriend = await friendRequestModel.findOne({
      $and: [{ $or: [{ senderId: data.from }, { senderId: data.to }] }, { $or: [{ sentTo: data.from }, { sentTo: data.to }] }],
      active: true,
    });
    if (isFriend) {
      const message = await messageModel({
        from: data.from,
        to: data.to,
        message: data.message,
      }).save();

      const toSocketId = await regModel.findOne({ _id: data.to }).select("socketId -_id");
      const thisMessageId = await messageModel.findOne({ from: data.from, to: data.to }).sort("-createdAt").select("_id");
      const messageRoom = await messageroomModel.findOne({
        $and: [{ $or: [{ from: data.from }, { from: data.to }] }, { $or: [{ to: data.to }, { to: data.from }] }],
      });
      if (messageRoom) {
        messageRoom["from"] = data.from;
        messageRoom["to"] = data.to;
        messageRoom["message"] = message._id;
        await messageRoom.save();
      } else await messageroomModel({ from: data.from, to: data.to, message: thisMessageId }).save();
      io.to(toSocketId.socketId).emit("message", { message: data.message });
      const customData = {
        userId: data.to,
      };
      const roomList = await getMessageRoomList(customData);
      io.to(toSocketId.socketId).emit(socketConstants.list, roomList);
    } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.userNotInYourFriendList));
  } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.pleaseLoginToChat));
};

module.exports.handleMessageRoom = async (data, socket, io) => {
  if (checkIfLoggedIn(socket.id)) {
    const newlist = await getMessageRoomList(data);
    io.to(socket.id).emit(socketConstants.list, newlist);
  } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.pleaseLogin));
};

module.exports.handleChat = async (data, socket, io) => {
  if (checkIfLoggedIn(socket.id)) {
    const inFriendList = await friendRequestModel.findOne({
      $and: [{ $or: [{ senderId: data.userId }, { sentTo: data.userId }] }, { $or: [{ senderId: data.of }, { sentTo: data.of }] }],
    });
    if (inFriendList) {
      const userBlocked = await blockUserModel.findOne({ userId: data.userId, blockedUserId: data.of });
      if (!userBlocked) {
        await messageModel.updateMany(
          {
            $and: [
              {
                $and: [{ $or: [{ from: data.userId }, { from: data.of }] }, { $or: [{ to: data.userId }, { to: data.of }] }],
              },
              { deletedBy: { $ne: data.userId } },
            ],
          },
          { isSeen: true }
        );
        const fetchChatThread = await messageModel
          .find({
            $and: [
              {
                $and: [{ $or: [{ from: data.userId }, { from: data.of }] }, { $or: [{ to: data.userId }, { to: data.of }] }],
              },
              { deletedBy: { $ne: data.userId } },
            ],
          })
          .sort("-createdAt");
        io.to(socket.id).emit(socketConstants.chat, fetchChatThread);
      } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.userIsBlockedByYou));
    } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.pleaseLogin));
  } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.userNotInYourFriendList));
};

module.exports.handleDeleteChat = async (data, socket, io) => {
  if (checkIfLoggedIn(socket.id)) {
    const inFriendList = await friendRequestModel.findOne({
      $and: [{ $or: [{ senderId: data.userId }, { sentTo: data.userId }] }, { $or: [{ senderId: data.of }, { sentTo: data.of }] }],
    });

    if (inFriendList) {
      const chatsBetweenThem = await messageModel.find({
        $and: [{ $or: [{ from: data.userId }, { from: data.of }] }, { $or: [{ to: data.of }, { to: data.userId }] }],
      });
      if (chatsBetweenThem?.length > 0) {
        await messageModel.updateMany(
          {
            $and: [{ $or: [{ from: data.userId }, { from: data.of }] }, { $or: [{ to: data.of }, { to: data.userId }] }],
          },
          { $addToSet: { deletedBy: data.userId } }
          //pullAll
        );
        io.to(socket.id).emit(socketConstants.success, createSuccessResponse(msgConstants.chatDeletedSuccessfully));
      } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.thereIsNoChatBetweenThem));
    } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.userNotInYourFriendList));
  } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.pleaseLogin));
};

module.exports.handleSeen = async (data, socket, io) => {
  const validId = utils.isValidObjectId(data.messageId);
  if (validId) {
    if (checkIfLoggedIn) {
      const messageExist = await messageModel.findOne({ _id: data.messageId, from: data.of, to: data.userId });
      if (messageExist) {
        messageExist["isSeen"] = true;
        await messageExist.save();
        io.to(socket.id).emit(socketConstants.success, createSuccessResponse(msgConstants.messageSeen));
      } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.messageNotExist));
    } else io.to(socket.id).emit(socketConstants.error, utils.createErrorResponse(msgConstants.userNotFound));
  } else io.to(socket.id).emit(socketConstants.error, createErrorResponse(msgConstants.invalidId));
};
