module.exports={
    ensureAuth:function(req,res,next){
        // here check if user is autheticated via google
        if (req.isAuthenticated()) {

            next()
            return
        }
        req.flash('err_msg','Make sure to Sign in to view resources!')
        res.redirect('/user/sign-in')
        
            
    },
    redirectAuth:function(req,res,next){
        if (!req.isAuthenticated()) {

            next()
            return
        }
        res.redirect('/posts')
        
            
    },
     wrap : middleware => (socket, next) => middleware(socket.request, {}, next)
}