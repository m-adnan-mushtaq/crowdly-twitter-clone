const { Router } = require("express");
const router = Router();
const { ensureAuth } = require("../utils/auth");
const Chat = require('../models/Chat');
const { isValidObjectId, default: mongoose } = require("mongoose");
const User = require("../models/User");
router.use(ensureAuth);


const chatPopulateOptions = {
  path: 'users',
  model: 'User',
  select: 'username profilePic'
}

router.route("/")
  .get(async (req, res, next) => {
    try {
      //find all chats where logged user exists
      const chats = await Chat.find({ users: { $in: [req.user._id] } }).populate(
        [
          {
            path: 'users',
            model: 'User',
            select: 'username profilePic'
          }, {
            path: 'latestMessage',
            model: 'Message',
            populate: {
              path: 'sender',
              model: 'User',
              select: 'username'
            }
          }
        ]).sort({ updatedAt: -1 })

      res.render("inbox", {
        title: "Messages",
        user: req.user,
        chats
      });
    } catch (error) {
      error.statusCode = 500
      next(error)
    }

  })


//-----------------------get chat route---------------
router.route('/:id')
  .get(async (req, res, next) => {
    try {

      let chatId = req.params.id
      //check if id is a valid id
      if (!chatId || !isValidObjectId(chatId)) throw Error('Invalid Credentials')


      //find chat if it exists
      let chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: req.user._id } } }).populate(chatPopulateOptions)
      //if chat is null try to find user
      if (!chat) {
        const toChatUser = await User.findById(chatId)
        if (toChatUser) {
          chat = await createChatWithUserHelper(req.user._id, chatId)
        }
      }
      res.render("chat", {
        title: "Chat",
        user: req.user,
        chat
      });
    } catch (error) {
      error.statusCode = 400
      next(error)
    }
  })
  .put(async (req, res) => {
    try {

      let chatId = req.params.id
      //check if id is a valid id
      if (!chatId || !isValidObjectId(chatId || req.body.title)) throw Error('Invalid Credentials')

      await Chat.findOneAndUpdate(
        { _id: chatId, users: { $elemMatch: { $eq: req.user._id } } },
        { title: req.body.title.trim() }
      )
      req.flash('info_msg', 'Chat Title Updated')
      res.status(204).redirect('back')
    } catch (error) {
      console.error(error);
      res.status(400).send(error.message)
    }
  })




//create chat helper by user id
function createChatWithUserHelper(loggedUserId, otherUserId) {
  return Chat.findOneAndUpdate({
    isGroupChat: false,
    "users": {

      $all: [
        {
          "$elemMatch": { $eq: mongoose.Types.ObjectId(loggedUserId) },
        },
        {
          "$elemMatch": { $eq: mongoose.Types.ObjectId(otherUserId) }
        }
      ],
      $size: 2,
    },
  }, {
    $setOnInsert: {
      users: [loggedUserId, otherUserId]
    }
  }, {
    new: true,
    upsert: true
  }).populate(chatPopulateOptions)
}
module.exports = router;


/*
  Referce Material
  https://www.mongodb.com/docs/manual/reference/operator/query/elemMatch/
  https://www.mongodb.com/docs/manual/reference/operator/query/all/
*/