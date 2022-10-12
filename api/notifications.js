const {Router}=require('express')
const router=Router()
const {ensureAuth}=require('../utils/auth')

const Notification=require('../models/Notification')
router.use(ensureAuth)
router.route('/')
.get(async (req,res)=>{
    try {
        const notifications = await Notification.find({recipient:req.user._id}).populate({
            path: 'sender',
            model: 'User',
            select: 'username profilePic'
          }).sort({createdAt:-1})
        res.json({notifications})
    } catch (error) {
        console.log(error);
        res.status(400).json(error)
    }
})
.put(async(req,res)=>{
    try {
        await Notification.updateMany({recipient:req.user._id},{isRead:true})
        req.flash('info_msg','Notifications marked Read!')
        res.redirect('back')
    } catch (error) {
        res.status(403).json({
            error:error.message
        })
    }
});

router.get('/getUnreadNotifications',async(req,res)=>{
    try {
        const count=await Notification.count({recipient:req.user._id,isRead:false})
        res.json({
            count
        })
    } catch (error) {
        res.status(403).json({
            error:error.message
        })
    }
})

router.put('/:id',async(req,res)=>{
    try {
        await Notification.findByIdAndUpdate(req.params.id,{isRead:true})
        res.status(204).json()
    } catch (error) {
        res.status(403).json({
            error:error.message
        })
    }
})

module.exports=router