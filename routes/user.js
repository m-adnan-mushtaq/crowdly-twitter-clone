const { Router } = require('express')
const router = Router()
const User = require('../models/User')
const Post=require('../models/Post')
const Follower = require('../models/Follower')
const passport = require('passport')
const { redirectAuth, ensureAuth } = require('../utils/auth')
const jwt = require('jsonwebtoken')
const { findAndPopulatePosts, populateUserFields ,listAllUsers,findPinnPost} = require('../utils/populationUtil')

const {sideBarMiddlewares}=require('../utils/middlewaresList')
const Notification = require('../models/Notification')
//--- show sing-up-route-------------
router.route('/sign-in').get(redirectAuth, (req, res) => {
    const user = new User()
    res.render('sign-in', { layout: 'layout/authLayout', title: 'Sign In to Account', user })
}).post(redirectAuth, (req, res, next) => {
    try {

        // serialize user to the database
        passport.authenticate('local', {
            failureRedirect: '/user/sign-in',
            failureFlash: true,
            failureMessage: 'Sign in failed! Try again!',
            successFlash: true,
            successMessage: 'Successfully! Logged in, Now Enjoy Your Journey on Crowdly!',
            successRedirect: '/posts'
        })(req, res, next)
    } catch (error) {
        req.flash('err_msg', 'Error While Logging In ,Try again!')
        res.redirect('/user/sign-in')
    }

})

// ---------------- GOOGLE SING-IN ROUTE-----------------
router.get('/google', redirectAuth, passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/callback', redirectAuth, (req, res, next) => {
    try {

        // serialize user to the database
        passport.authenticate('google', {
            failureRedirect: '/users/sign-in',
            failureFlash: true,
            failureMessage: 'Sign in failed! Try again!',
            successFlash: true,
            successMessage: 'Successfully! Logged in, Now Enjoy Your Journey on Crowdly!',
            successRedirect: '/posts'
        })(req, res, next)
    } catch (error) {
        console.log(error.message);
        req.flash('error', error.message)
        res.status(400).redirect('/user/sign-in')
    }
})


router.get('/verify', redirectAuth, (req, res) => {
    res.render('verify', { layout: 'layout/authLayout', title: 'Verification Process' })
})

router.get('/checkVerification/:token', redirectAuth, (req, res) => {
    jwt.verify(req.params.token, process.env.APP_SECRET, async (err, decoded) => {
        try {
            if (err) throw new Error(err)
            // found by user doced
            const foundUser = await User.findOneAndUpdate({ _id: decoded._id }, { verified: true }, { new: true }).exec()
            if (!foundUser) throw new Error('Invalid Token!')
            req.flash('success_msg', 'Acccount has been verified, Enjoy your Jounrey!')
            res.redirect('/user/sign-in')
        } catch (error) {
            res.status(400).send(`<h1 style="color:'red';">Your Session has been expired!</h1> `)
            console.log(error.message)
        }
    })
})

//------------------------- LOG OUT ROUTE--------------------------
router.get('/logout', (req, res) => {
    req.logOut(() => {

        req.flash('info_msg', 'Logged Out!, See you soon')
        res.redirect('/user/sign-in')
    })
})


//-------------------- list all users-------------------------------
router.get('/connect',ensureAuth,async (req,res,next)=>{
    try {
        const allUsers=await listAllUsers()
        res.render('connect',{allUsers,user:req.user,title:'Connect'})
    } catch (error) {
        next(error)
    }
})
//--------------------------------------view profile page route--------------------------------
router.get('/:username', sideBarMiddlewares, populateUserFields(), async (req, res,next) => {
    try {
        if(!req.profileUser) throw Error('No Such User Exists!')

        // find pinned post
        const query = {
            author: req.profileUser._id,
            author: req.profileUser._id,
            images: { $exists: true, $size: 0 },
            replyTo: { $exists: false },
            pinned:false
            
        }
        const foundPosts = await findAndPopulatePosts(query)
        const pinnedPost=await findPinnPost({author:req.profileUser._id,pinned:true})
        res.render('profile', { user: req.user, profileUser: req.profileUser, pinnedPost,title: req.profileUser.username, activeTab: 'tweets', posts: foundPosts ,randomUsers:req.randomUsers})
    } catch (error) {
        error.statusCode = 404
        next(error)
    }

})
//--------------------------------------view profile page route--------------------------------

router.get('/:username/replies', sideBarMiddlewares, populateUserFields(),async (req, res,next) => {
    try {
       
        if(!req.profileUser) throw Error('No Such User Exists!')
        // find posts whose are reply given to others
        const query = {
            author: req.profileUser._id,
            images: { $exists: true, $size: 0 },
            replyTo: { $exists: true }
        }
        const foundPosts = await findAndPopulatePosts(query)
        res.render('profile', { user: req.user, profileUser: req.profileUser, title: req.profileUser.username, activeTab: 'replies', posts: foundPosts ,randomUsers:req.randomUsers})
    } catch (error) {
        error.statusCode = 403
        next(error)

    }
})
//--------------------------------------view profile page route--------------------------------
router.get('/:username/media',sideBarMiddlewares, populateUserFields(), async (req, res,next) => {
    try {
        const {_id} =await User.findOne({username:req.params.username})
        if(!_id) throw Error('No User Found')

        // find posts whose are reply given to others
        const query = {
            author: _id,
            images: { $exists: true, $ne: [] },
            replyTo: { $exists: false }
        }
        const foundPosts = await findAndPopulatePosts(query)
        res.render('profile', { user: req.user, profileUser: req.profileUser, title: req.profileUser.username, activeTab: 'media', posts: foundPosts ,randomUsers:req.randomUsers})
    } catch (error) {
        error.statusCode = 403
        next(error)

    }
})
//--------------------------------------view profile page route--------------------------------
router.get('/:username/likes', sideBarMiddlewares, populateUserFields(), async (req, res,next) => {
    try {
        const { likedPosts } = await User.findOne({ username: req.params.username }).populate({
            path: 'likedPosts',
            model: 'Post',
            populate: [
                {
                    path: 'author images'
                }
            ]
        })
        res.render('profile', { user: req.user, profileUser: req.profileUser, title: req.profileUser.username, activeTab: 'likes', posts: likedPosts ,randomUsers:req.randomUsers})
    } catch (error) {
        error.statusCode = 403
        next(error)

    }
})


//-------------- show specific user followers and follow  list-----------------------
router.get('/:username/followers', ensureAuth, populateUserFields(), async (req, res,next) => {
    try {
        res.render('followList', { title: req.profileUser.username, activeTab: 'followers', profileUser: req.profileUser, user: req.user })
    } catch (error) {
        error.statusCode = 400
        next(error)
    }
})
router.get('/:username/following', ensureAuth, populateUserFields(), async (req, res) => {
    try {
        res.render('followList', { title: req.profileUser.username, activeTab: 'following', profileUser: req.profileUser, user: req.user })
    } catch (error) {
        error.statusCode = 400
        next(error)
    }
})
//---------------------------- followers and following handling route-----------------------------------------
router.put('/:id/follow', ensureAuth, async (req, res) => {
    try {
        if(!req.params.id) throw Error('Invalid requst!')
        const profileUser=await User.findById(req.params.id)
        if(!profileUser) throw Error('No Such User Exist!')
        let deleteFollower = await Follower.findOneAndDelete({ follower: req.user._id, followee: profileUser._id })
        let count = -1
        if (!deleteFollower) {
            // means user have not followed yet and user following list does not contains profileUser
            count = +1
            await Follower.create({ follower: req.user._id, followee: profileUser._id })
            await Notification.createNotification({
                sender:req.user._id,
                recipient:profileUser._id,
                type:'Follow',
                entityId:req.user._id
            })
        }
       
        res.json({
            count
        })
    } catch (error) {
        console.log(error);
        res.status(403).json({
            error: error.message
        })
    }
})


module.exports = router