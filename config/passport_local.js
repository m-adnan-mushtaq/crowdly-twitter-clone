const LocalStrategy=require('passport-local').Strategy
const passport=require('passport')
const User=require('../models/User')
// local strategy for our database users
module.exports=function(){
    passport.use(
        new LocalStrategy({usernameField:'email' || 'username'},async (email,password,done)=>{
            try {
                // search the user by it's email in your data base
                const foundUser= await User.findOne({$or:[{email},{username:email.trim()}]}).exec()
                if(!foundUser)
                    return done(null,false,{message:'Email or Username is invalid!'})
                // if a userfounds match it's password
                const match = await foundUser.comparePassword(password)
                if(!match)
                    return done(null,false,{message:'Password is incorrect!, Try again!'})
                    
                    // now also chekc if user is  verified
                    if (!foundUser.verified) {
                    return done(null,false,{message:'Account has not verified Yet!'})
                    
                }
                // then if everyting is okay done serialize it    
                else    
                    return done(null,foundUser)
            } catch (error) {
                return done(error)
            }
        })

        // passport serialize and deserialize
        )
        passport.serializeUser( function(user,done) {
            // here serialize user's id
            done(null,user.id)
        })
        // deserialize user
        passport.deserializeUser(async function(id,done) {
            try {
                const user= await User.findById(id).exec()
                done(null,user)
            } catch (error) {
                console.log(error);
            }
        })
}