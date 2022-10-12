const mongoose=require('mongoose')
const {Schema}=mongoose
const bcrypt=require('bcrypt')
const userSchema=new Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        validate: {
            validator: function(v) {
              return /^[a-zA-Z0-9 ]+$/.test(v);
            },
            message: props => `${props.value} not a valid name! Use only Letters!`
        }    
    },
    email:{
        type:String,
        required:true,
        unique:true,
        validate: {
            validator: function(v) {
              return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} not a valid Email Address!`
        },
    },
    username:{
        type:String,
        required:true,
        unique:[true,"username should be unique!"],
        required:true,
        validate: {
            validator: function(v) {
              return  /^\S*$/.test(v);
            },
            message: props => `${props.value} should not contains any white-spaces!`
        } 
    },
    password:{
        type:String,
        minLength:[4,'Password must be 4 characters long!'],
    },
    verified:{
        type:Boolean,
        default:false
    },
    profilePic:{
        type:String,
        required:true,
        default:'/assets/avatar.png'
    },
    coverPic:{
        type:String
    },
    googleId:{
        type:String
    },
    likedPosts:[
        {
            type:mongoose.Types.ObjectId,
            ref:'Post',
            required:true
        }
    ],
    retweets:[
        {
            type:mongoose.Types.ObjectId,
            ref:'Post',
            required:true
        }
    ],
},{ timestamps: true ,toJSON:{virtuals:true},toObject:{virtuals:true}})


//populat followers virtually
// user followers represents his followe
userSchema.virtual('followers',{
    localField:'_id',
    foreignField:'followee',
    ref:'Follower' 
})
// and user following 
userSchema.virtual('following',{
    localField:'_id',
    foreignField:'follower',
    ref:'Follower',
    justOne:false// by-default false
})

// hash the user password
userSchema.methods.hashPassword=async (password)=>{
    // hash the password
    try {
        return await bcrypt.hash(password,10)
    } catch (error) {
        return error
    }
}


// compare password with typed password
userSchema.methods.comparePassword=async function(password){
    try {
        return await bcrypt.compare(password,this.password)
    } catch (error) {
        return null
    }
}

//export user
module.exports=mongoose.model('User',userSchema)