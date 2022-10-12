const { Router } = require('express')
const router = Router()
const { ensureAuth } = require('../utils/auth')
const Post = require('../models/Post')
const User=require('../models/User')
const Notification = require('../models/Notification')
const {findAndPopulatePosts,findSpecificPost}=require('../utils/populationUtil')
const {sideBarMiddlewares}=require('../utils/middlewaresList')
const {bufferMultipleImagesHelper}=require('../utils/fileUploadUtils')

//------------ view news feed route------------------------
router.route('/')
.get(sideBarMiddlewares, async (req, res,next) => {
        try {
            let queryObj={}
            const query=req.query
            // find all posts and show to the page
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
            const posts=await findAndPopulatePosts(queryObj)
            res.render('newsFeed', { title: 'Home' ,posts,user:req.user,randomUsers:req.randomUsers,pf:query.pf})
        } catch (error) {
            next(error)
        }

})
.post(ensureAuth, async (req, res) => {
    // save the post with current user logged in as author and check for images if user upload any images
    try {
        let postDoc = new Post({
            content: req.body.content
        })
        postDoc.author = req.user._id
        let postImages = req.body['post-images']


        if (postImages) {
            postImages = JSON.parse(JSON.stringify(postImages))
            // now check if user has uploaded single or multiple  images
            if (typeof postImages == 'string') {
                postImages = [{ ...JSON.parse(postImages) }]
            } else {
                postImages = postImages.map(img => JSON.parse(img))
            }
            let postImagesId = await bufferMultipleImagesHelper(postDoc, postImages)
            postDoc.images = postImagesId
        }
        await postDoc.save()
        req.flash('success_msg', 'Tweet created!')
        res.status(201).redirect(`/posts/${postDoc._id}`)

    } catch (error) {
        req.flash('error', 'Invalid Credentials!, Try again later.')
        res.status(400).render('newsFeed', { title: 'Home', content: req.body.content })
    }
})


//---------------------- LIKE POST ROUTE-------------------
router.put('/:id/like',ensureAuth,async(req,res)=>{
    // now here goal is two things first check if user is liked or disliking the post 
    try {
        const isLiked=req.user.likedPosts.includes(req.params.id)

        // if already liked remove like otherwise add a like count
        let queryOperator=isLiked?'$pullAll':'$addToSet'
        // now update the related docs accordingly
        const updatedPost=await Post.findOneAndUpdate({_id:req.params.id},{[queryOperator]:{likes:[req.user._id]}},{new:true}).exec()
        req.user=await User.findOneAndUpdate({_id:req.user._id},{[queryOperator]:{likedPosts:[req.params.id]}},{new:true}).select('likes').exec()
    
        if(!isLiked){
            await Notification.createNotification({
                sender:req.user._id,
                recipient:updatedPost.author,
                type:'Like',
                entityId:updatedPost._id
            })
        }
        res.status(201).json({
            isLiked:!isLiked,
            likesCount:updatedPost.likes.length
        })
    } catch (error) {
        console.log(error.message);
        res.json({error})
    }

})


//---------------------    RETWEET POST ROUTE------------------------------------------------
router.post('/retweet',ensureAuth,async (req,res)=>{
    const targetPostId=req.body.postId
    if (!targetPostId) {
        req.flash('err_msg','Something Went Wrong')
        res.redirect('back')
        return
    }
    try {
    // first delete that post if user is removing retweet
    const deletedPost=await Post.findOneAndDelete({$and:[{author:req.user._id},{retweetData:targetPostId}]}).exec()
    // now if post is not deleted create one's
    let qOperator=deletedPost?'$pullAll':'$addToSet'

    let rePost=deletedPost
    // now create post
    if (!rePost) {
        rePost=await Post.create({
            author:req.user._id,
            retweetData:targetPostId,
            retweetQuote:(req.body?.quote)?req.body.quote:null
        })
    }
    // now insert in user retweets and post retweetUsers
    req.user=await User.findOneAndUpdate({_id:req.user._id},{[qOperator]:{retweets:[rePost._id]}},{new:true})
    // update posts retweets count
    let updatedPost=await Post.findOneAndUpdate({_id:targetPostId},{[qOperator]:{retweetUsers:[req.user._id]}})
    if(!deletedPost){
        await Notification.createNotification({
            sender:req.user._id,
            recipient:updatedPost.author,
            type:'Retweet',
            entityId:updatedPost._id
        })
    }
    
    req.flash('info_msg','Saved changes!')
    res.redirect('back')
} catch (error) {
        req.flash('error','Invalid Credentials! Try again!')
        res.status(403).send(error.message)
        console.log(error);
    }
    
})


//---------------------- FOR REPLYIN POST-------------------------------
router.post('/reply',ensureAuth,async(req,res)=>{
    try {
        const postId=req.body.postId
        if(!postId) throw Error('No Post Id Found!')
        // so idea is create the post whose reply to field contains the refer to the that post
        const {_id}=await Post.create({
            content:req.body.reply.trim(),
            replyTo:postId,
            author:req.user._id
        })
        // now update the replies count whose reply is given
        let updatedPost=await Post.findOneAndUpdate(
            {_id:postId},
            {$push:{replies:_id}})

        await Notification.createNotification({
            sender:req.user._id,
            recipient:updatedPost.author,
            type:'Reply',
            entityId:postId
        })    
        req.flash('info_msg','Reply saved!')
        res.status(201).redirect('back')  
        
    } catch (error) {
        console.log(error);
        req.flash('error','Invalid Request, Try again!')
        res.status(400).redirect('/posts')
    }
})

//------------- DELETING POSTS---------------------------------
router.delete('/delete',ensureAuth,async(req,res)=>{
    if(!req.body.postId) throw Error('Post Id not found!')
    try {
        // delete post
        // if delte post was a reply then update the main post array
        let deletePost=await Post.findOne({_id:req.body.postId})
        if (deletePost.replyTo) {
            // then update that post replies array
            await Post.findOneAndUpdate({_id:deletePost.replyTo},{$pull:{replies:deletePost._id}}).exec()
        }
        // also update  the retweets array  of post
        if (deletePost.retweetData) {
            await Post.findOneAndUpdate({_id:deletePost.retweetData},{$pull:{retweetUsers:req.user._id}}).exec()
        }
        await Post.deleteMany({retweetData:req.body.postId}).exec()
        await Post.deleteOne({_id:req.body.postId}).exec()
        
        req.flash('success_msg','Deleted Successfully!')
        res.status(202).redirect('/posts')
    } catch (error) {
        console.log(error);
        req.flash('error','Something Went Wrong, Try again!')
        res.status(403).redirect('back')
    }
})



router.patch('/pinn',ensureAuth,async(req,res,next)=>{
    try {
        let {postId,pinned}=req.body
        if(!postId || !pinned) throw Error('Invalid Credentials!')
        // unpinned all previous posts
        await Post.updateMany({author:req.user._id},{pinned:false})
        // find post and update it's pinned value
        pinned=(pinned=='true')?true:false;
        await Post.findOneAndUpdate({_id:postId,author:req.user._id},{pinned}).exec()
        req.flash('success_msg','Saved Changes!')
        res.redirect('back')
    } catch (error) {
        error.statusCode = 403
        next(error)
    }
})
// ---------------- view single post route------------------
router.get('/:id', sideBarMiddlewares, async (req, res,next) => {
    try {
        // find post if it contains any images then redner slider page otherwise show simple layout
        let post=await findSpecificPost({_id:req.params.id})
        // return res.send(post)

        if (post.images.length) {
            res.render('imgPost',{layout:'layout/authLayout',title:'View tweet',post,user:req.user})
            return
        }else{
            res.render('noImgPost', { title: 'View tweet' ,post,user:req.user,randomUsers:req.randomUsers})
        }
    } catch (error) {
        error.statusCode = 403
        next(error)
    }

})




module.exports = router