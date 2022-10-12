const { Router } = require("express");
const router = Router();
const { ensureAuth } = require("../utils/auth");
const { findAndPopulatePosts, listAllUsers } = require("../utils/populationUtil");
const User=require('../models/User')
router.use(ensureAuth);
router.get("/", async (req, res) => {
  try {
    const {query}=req
    let activeTab='latest'

    let queryObj={}
    if (query.q!=null && query.q!='') {
        queryObj.content= RegExp(query.q.trim(),'ig')
    }
    if(query.start){
        if(isNaN(Date.parse(query.start))) throw Error('Invalid Credentials, request failed!')
        queryObj.createdAt={"$gte":new Date(query.start)}
    }
    if(query.end){
        if(isNaN(Date.parse(query.end))) throw Error('Invalid Credentials, request failed!')
        queryObj.createdAt={"$lte":new Date(query.end)}
    }
    if (query.start && query.end) {
        if(isNaN(Date.parse(query.start))  && isNaN(Date.parse(query.end))) throw Error('Invalid Credentials, request failed!')
        queryObj.createdAt={"$gte":new Date(query.start),"$lte":new Date(query.end)}
    }
    if(query.type && query.type=='media'){
        queryObj.images={ $exists: true, $ne: [] }
        activeTab='photos'
    }

    if(query.pf && query.pf == 'follower'){
        // populat that user followings list  and show only posts form author who user follows! check for $in operator  
        const loggedUser=await User.findOne({_id:req.user._id}).populate('following')
        let authorIds=[]
        if(loggedUser.following.length) {
            authorIds=loggedUser.following.map(doc=>doc.followee)
        }
        authorIds.push(req.user._id)
        queryObj.author={$in:authorIds}
    }
    const foundPosts = await findAndPopulatePosts(queryObj);
    res.render("searchPosts", {
      title: "Search",
      user: req.user,
      activeTab,
      query: query.q,
      type: query.type,
      foundPosts,
      pf:query.pf
    });
  } catch (error) {
    console.log(error);
    req.flash('error','Invalid Credentials, try again!')
    res.status(403).redirect('back')
  }
});


router.get('/people',async(req,res,next)=>{
    const queryObj={}
    const {query}=req
    if(query.q && query.q!='')
        queryObj['$or']=[{username:new RegExp(req.query.q,'ig')},{name:new RegExp(req.query.q,'ig')}]
    try {
        const allUsers=await listAllUsers(queryObj)
        res.render('searchUsers',{allUsers,user:req.user,title:'Search',activeTab:'people',query:query.q})
        
    } catch (error) {
        error.statusCode = 400
        next(error)
    }
})

module.exports = router;
