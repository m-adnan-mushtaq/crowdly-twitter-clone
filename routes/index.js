const {Router}=require('express')

const router=Router()
const User=require('../models/User')
const {redirectAuth}=require('../utils/auth')
const jwt=require('jsonwebtoken')
const transport=require('../config/transporter')
const {sideBarMiddlewares}=require('../utils/middlewaresList')


//--- -------------------show sign-up-route---------------
router.route('/')
.get(redirectAuth,(req,res)=>{
    const user=new User()
    res.render('index',{layout:'layout/authLayout',title:'Create New Account',user})
})
.post(redirectAuth,async(req,res)=>{
    try {
        const inputPassword=req.body.password
        let newUser=new User({
            ...req.body
        })
        newUser.password=await newUser.hashPassword(inputPassword)
        const {_id}=await newUser.save()
        // create token for user
        jwt.sign({_id},process.env.APP_SECRET,{expiresIn:'1h'},async(err,token)=>{
            if(err) throw new Error('Something Went Wrong, Try again later!')

            // now send email
            await transport(req.body.email.trim(),{
                subject:'Verify Your Email!',
                message:`
                <center
                style="color:#2e2e2e;background-color:#f9f9f9;box-shadow:2px 2px 4px #e4e4e4;margin:20px auto;padding: 2em;border-radius: 1em;">
                <div style="background:#005b93;color:#fff;font-size:1.2rem;padding:1em 2em;">
                    <h1>Hi, Welcome to Crowdly Platform</h1>
                    <h5>You are just a click away! 🤗</h5>
                </div>
                <div style="padding:1em;font-size: 2rem;">
                <p style="font-size:2rem;">Click below link to <i><b>Verify</b></i> your email!</p>
                <a href="http://localhost:3000/user/checkVerification/${token}" style="margin:1em 0;text-decoration: none;font-size:1.6rem;background-color: #1da1f2;color:#fff;border-radius: 10px;outline: none;border:0;padding:.5em 1em;cursor: pointer;">Verify Me </a>
            </div>
                <div style="background:#303030;font-size:1rem;padding:1em 2em;color:#fff;">
                    <p style="font-size:1.5rem;color:##ff5151;"> ⚠ Link will be expired after 1 Hour!</p>
                    <p>&copy;2022 Crowdly - Adnan Malik</p>
                </div>
            </center>
                `
            })
            req.flash('info_msg','Account Created Successfully!, Verify Account to continue!')
            res.redirect('/user/verify')
        })
    } catch (error) {
        if (error.code==11000) {
            req.flash('err_msg','Username or Email is already in use!')
        }else{
            req.flash('err_msg','Invalid Credentials, Make sure all input fields have a valid value!')
        }
        res.locals.err_msg=req.flash('err_msg')
        
        res.render('index',{title:'Create New Account',layout:'layout/authLayout',user:req.body,showModal:true})
    }
});


//-------------- EXPLORE PAGE---------------------------------
router.get('/explore',sideBarMiddlewares,(req,res,next)=>{
    try {
        res.render('explore',{title:'Explore',user:req.user,randomUsers:req.randomUsers})
    } catch (error) {
        error.statusCode=500
        next(error)
    }
})



module.exports=router
