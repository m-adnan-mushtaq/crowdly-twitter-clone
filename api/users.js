const { Router } = require('express')
const router = Router()
const { ensureAuth } = require('../utils/auth')
const User = require('../models/User')
const Chat=require('../models/Chat')
router.use(ensureAuth)
// ---------------- API URL 👉for showing  post in modals like replies and quote retweet modal----------------------
router.get('/findChatMembers', async (req, res) => {
    try {
        const query = req.query.query
        const foundUsers = await User.find({
            $and: [
                { username: { $ne: req.user.username } }
                , {
                    $or: [
                        { username: new RegExp(query, 'ig') },
                        { name: new RegExp(query, 'ig') },
                    ]
                }
            ]
        }).select({name:1,username:1,profilePic:1})
        res.json({
            foundUsers
        })
    } catch (error) {
        console.log(error);
        res.json({
            error: error.messsage
        })
    }

})


//create chat api
router.post('/createChat',async(req,res)=>{
    try {
       //get the ids from json and create chat
       let {users,isGroupChat}=req.body
       if(!users && !users.length) throw Error('No Users selected!')
       users.push(req.user._id)


       let chatDoc=new Chat({
         users,
         isGroupChat
       })
       let {_id}=await chatDoc.save()
       res.status(201).json({
          success:true,
          chatId:_id
       })
    } catch (error) {
      console.log(error);
      res.status(400).json({
        success:false,
        error:error.message
      })
    }
})
module.exports = router