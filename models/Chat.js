const mongoose = require("mongoose");

//latest message will help us to sort and displayig latest messsage in inbox ui

const chatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    users: {
      type: [{ type: "ObjectId", ref: "User" }],
      required: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    latestMessage: {
      type: "ObjectId",
      ref: "Message",
    },
  },
  { timestamps: true }
);

chatSchema.pre("save", async function (next) {
  //this refers to document
  try {
    //see if chat already exists
    console.log(this.users);
    let isFound = await this.collection.findOne({
      users: {
        $all: [this.users],
      },
    });
    console.log(isFound);
    if(isFound) throw Error('Chat Already Exists')
    next()
  } catch (error) {
    next(error);
  }
});

/**
  https://mongoosejs.com/docs/middleware.html
 */
module.exports = mongoose.model("Chat", chatSchema);
