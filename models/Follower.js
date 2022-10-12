const mongoose=require('mongoose')

//Follow respresents follower and following represents followee
const followerSchema=new mongoose.Schema({
    follower:{
        type:'ObjectId',
        ref:'User'
    },
    followee:{
        type:'ObjectId',
        ref:'User'
    }
})
module.exports=mongoose.model('Follower',followerSchema)