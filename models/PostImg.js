const mongoose=require('mongoose')

const postImgSchema=new mongoose.Schema({
    mimeType:{
        type:String,
        enum:['image/jpeg','image/jpg','image/png']
    },
    data:{
        type:Buffer
    },
    post:{
        type:mongoose.Types.ObjectId,
        ref:'Post',
        required:true
    }
},{
    toJSON:{virtuals:true},
    toObject: { virtuals: true }
})


// virtual path for displaying  actuall images
postImgSchema.virtual('imgUrl').get(function () {
    if (this.data != null && this.mimeType != null) {
        return `data:${this.mimeType};charset=utf-8;base64,${this.data.toString('base64')}`
      }
})


module.exports=mongoose.model('PostImg',postImgSchema)