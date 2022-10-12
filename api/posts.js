const {Router}=require('express')
const router=Router()
const {ensureAuth}=require('../utils/auth')
const {findSpecificPost}=require('../utils/populationUtil')
// ---------------- API URL 👉for showing  post in modals like replies and quote retweet modal----------------------
router.get('/:id',ensureAuth,async (req,res)=>{
    if(!req.params.id) {
        req.flash('err_msg','No Post id found!')
        res.sendStatus(403)
        return
    }
    try {
        let post=await findSpecificPost({_id:req.params.id})
        res.json({post})
    } catch (error) {
        res.status(400).json(error)
    }
})
module.exports=router