const mongoose = require('mongoose')
const PostImg=require('./PostImg')
const User=require('./PostImg')
const Notification=require('./Notification')
//-------- time variables-----------------
let secondsInMin = 60
let secondsInHour = 60 * secondsInMin
let secondsInDay = 24 * secondsInHour
let secondsInWeek = 7 * secondsInDay
let secondsInMonth = 30 * secondsInWeek
let secondsInYear = 12 * secondsInMonth

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        maxLength: 240,
    },
    author: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    images: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'PostImg',
        }
    ],
    pinned: {
        type: Boolean,
        default: false
    },
    likes: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'User',
        }
    ],
    retweetUsers: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'User'
        }
    ],
    retweetData: {
        type: mongoose.Types.ObjectId,
        ref: 'Post'
    },
    retweetQuote: {
        type: String
    },
    replyTo: {
        type: mongoose.Types.ObjectId,
        ref: 'Post'
    },
    replies: [{
        type: mongoose.Types.ObjectId,
        ref: 'Post'
    }]
}
    , {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject:{virtuals:true}

    })


// virtual computed property for showing time
postSchema.virtual('uploadedAt').get(function () {
    // here this refers to the doc
    let cTime = new Date().getTime()
    let createdTime = new Date(this.createdAt).getTime()


    // now take the difference
    let diff = Math.floor((cTime - createdTime) / 1000)
    let returnTime = '';
    if (diff < 1) {
        returnTime = 'Just Now'
    } else if (diff < secondsInMin) {
        let t=elapseDivider(diff, 60);
        if(t<2) returnTime='Just Now'
        else returnTime = `${elapseDivider(diff, 60)} seconds ago`
    } else if (diff < secondsInHour) {
        returnTime = `${elapseDivider(diff, secondsInMin)} min ago`
    } else if (diff < secondsInDay) {
        returnTime = `${elapseDivider(diff, secondsInHour)} hour ago`
    } else if (diff < secondsInMonth) {
        returnTime = `${elapseDivider(diff, secondsInDay)} day ago`
    } else if (diff < secondsInYear) {
        returnTime = `${elapseDivider(diff, secondsInMonth)} month ago`
    }else{
        returnTime = `${elapseDivider(diff, secondsInYear)} years ago`
    }
    return returnTime;
})



//--------- delete pre method delete post it from the liked posts and retweets and delete all replies

postSchema.pre('deleteOne' ,async function(next){
    try {
        let postDoc=await this.model.findOne(this.getQuery())
        if(!postDoc) next(Error('No Post exists!'))
         // delete all images if post contains any images
        if (postDoc.images?.length>0) {
            // then delete all images
            await PostImg.deleteMany({post:postDoc._id})
        }
        //delte all notification relavent post
        await Notification.deleteMany({
            entityId:postDoc._id
        })

    // now remove it from the user liked posts and retweeets
    await User.updateMany({},{$pull:{likes:postDoc._id}})
    await User.updateMany({},{$pull:{retweets:postDoc._id}})
    // remove that post from replies
    next()
    } catch (error) {
        next(error)
    }
   
})

function elapseDivider(diff, elapse) {
    return Math.round(diff / elapse)
}

module.exports = mongoose.model('Post', postSchema)