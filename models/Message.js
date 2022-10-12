const mongoose = require("mongoose");

//latest message will help us to sort and displayig latest messsage in inbox ui

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
    },
    readBy: {
      type: [{ type: "ObjectId", ref: "User" }],
    },
    sender:{
        type: "ObjectId",
        ref: "User",
    },
    chat:{
        type: "ObjectId",
        ref: "Chat",
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Message", messageSchema);
