
const Message=require('../models/Message')
const Chat=require('../models/Chat')

module.exports=function () {
    Message.watch([
        {
             $match:{
                operationType:'insert'
             }
        }
    ]).on('change',async(change)=>{
        try {
            switch (change.operationType) {
                case 'insert':
                    //update the relavent chat latest message
                    let doc=change.fullDocument
                    await Chat.findOneAndUpdate({_id:doc.chat},{latestMessage:doc._id},{new:true})
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error(error)
        }
    })
}