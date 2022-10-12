const { Router } = require('express')
const router = Router()
const { ensureAuth } = require('../utils/auth')
const Message = require('../models/Message')
const Chat=require('../models/Chat')

const senderPopulateOptions={
    path:'sender',
    model:'User',
    select:'username profilePic'
}
// ---------------- API URL getting all messages ---------------------
router.use(ensureAuth)

//getting count of unread chats-----------------------------

router.get('/getUnreadMessages',async(req,res)=>{
    try {
        let unreadChats=await Chat.find({
            users:{
                $in:[req.user._id]
            },
            latestMessage:{
                $exists:true
            }
        }).populate({
            path:'latestMessage',
            match:{
                readBy:{
                    $nin:[req.user._id]
                }
            }
        })
        
        unreadChats=unreadChats.filter(chat=>chat.latestMessage!=null )
        let count=unreadChats.length
    //    console.log('unread messages => ',count); 
       res.json({
        count
       })
    } catch (error) {
        console.error(error)
        res.status(400).json({
            error
        })
    }
})

router.put('/:chatId/markRead',async(req,res)=>{
    try {
        //get the ids from json and create chat
        const chatId=req.params.chatId
        if ( !chatId ) throw Error('No Users selected!')


        //update all messages 
        await Message.updateMany({
            chat:chatId,
        },{
            $addToSet:{
                readBy:req.user._id
            }
        })
        // console.log('snapshot => ',snapshot);

        res.status(204).json()
    } catch (error) {
        console.log(error);
        res.status(403).json({
            success: false,
            error: error.message
        })
    }
})

router.route('/:chatId')
.get(async (req, res) => {
    try {
        const chatId=req.params.chatId
        if(!chatId) throw Error('No Chat Id Found')
        const messages = await Message.find({chat:chatId}).populate(senderPopulateOptions)
        res.json({
            messages
        })
    } catch (error) {
        console.log(error);
        res.status(403).json({
            error: error.messsage
        })
    }

})
//create chat api
.post(async (req, res) => {
    try {
        //get the ids from json and create chat
        let { senderId ,content,activeChatOnlineUsers:onlineUsers} = req.body
        content = content.trim()
        const chatId=req.params.chatId
        if (!senderId || !chatId || !content || !onlineUsers) throw Error('Invalid Credentials')

        //create new message
        let message = await Message.create({
            sender: senderId, chat: chatId, content,
            // readBy:[req.user._id]
            readBy:onlineUsers
        })
        message=await  message.populate(senderPopulateOptions)

        // TODO: update the latest message of inbox
        res.status(201).json({
            success: true,
           message
        })
    } catch (error) {
        console.log(error);
        res.status(403).json({
            success: false,
            error: error.message
        })
    }
});


module.exports = router