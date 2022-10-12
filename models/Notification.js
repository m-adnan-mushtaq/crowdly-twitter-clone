const mongoose = require("mongoose");

//latest message will help us to sort and displayig latest messsage in inbox ui

const notificationSchema = new mongoose.Schema(
  {
    sender:{
        type: "ObjectId",
        ref: "User",
    },
    recipient:{
        type: "ObjectId",
        ref: "User",
    },
    type:{
        type:String,
        required:[true,'Notification must have a type property!'],
        enum:{values:['Like','Retweet','Message','Reply','Follow'],message:'{VALUE} is not supported' },
    },
    isRead:{
        type:Boolean,
        default:false
    },
    entityId:{
        type: "ObjectId",
        required:true
    }
  },
  { timestamps: true }
);


notificationSchema.index({recipient:1})


notificationSchema.statics.createNotification=async function (credentials) {
    try {
        if(!credentials) throw Error('Invalid Credentals')
        //check if sender and recipient is same then return
        if(credentials.sender.toString()==credentials.recipient.toString()) return
        await this.deleteOne(credentials)
        return this.create(credentials)
    } catch (error) {
        throw Error(error)
    }
}
module.exports = mongoose.model("Notification", notificationSchema);
