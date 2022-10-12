const multer=require('multer')
const storage=multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 * 5 },//5mb,
}).fields([
  {
    name:'profileImg',
    maxCount:1
  },{
    name:'coverImg',
    maxCount:1
  }
])
module.exports=upload