const Notification = require("../models/Notification");
const User = require("../models/User");

module.exports = function (io) {
    Notification.watch([
    {
      $match: {
            operationType: "insert",
      },
    },
  ]).on("change", async (change) => {
    try {
      switch (change.operationType) {
        case "insert":
          //whenver notification is created notify user and refresh notify badge
          let doc = change.fullDocument;
          doc=await User.populate(doc,{path:'sender',select:'username profilePic'})
          io.to(doc.recipient.toString()).except(doc.sender.toString()).emit('new-notification',doc)
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(error);
    }
  });
};
