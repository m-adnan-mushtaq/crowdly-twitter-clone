const onlineUsers = {}

module.exports = function (io) {


  //middlwares 
  io.use((socket, next) => {
    if (socket.handshake.auth.id) {
      //you can verify  id if u wish!
      next();
    } else {
      next(new Error("unauthorized request"))
    }
  });

  io.on('connection', socket => {
        //  console.log('new socket connection  to server', socket.id);
        socket.on('connected', loggedUserId => {
            // console.log('loggedUser => ', loggedUserId);
            socket.join(loggedUserId)
            onlineUsers[loggedUserId] = loggedUserId
        })
        socket.on('join-chat', (chatRoomId, userId, cb) => {
            //join chat room
            socket.join(chatRoomId)
            let onlineUsersIdsArr = Object.keys(onlineUsers)
            //pass back previous online users to new logged user so he can retrieve previously online users
            cb(onlineUsersIdsArr)
            //inform others users in that chat room about  new user is online
            socket.to(chatRoomId).emit('updateActiveUsers', onlineUsersIdsArr)
        })

        //send and receive message
        socket.on('message-sent',(message,recipientIds)=>{
            if(!recipientIds || !recipientIds.length) return

            recipientIds.forEach(id => {
              //extract the logged user
              id=id.toString()
              if(socket.handshake.auth.id==id) return
              socket.to(id).emit('message-recieved',message)
              socket.to(id).emit('update-message-badge')
            });
        })



        //event for updating typing status

        socket.on('notify-typing',(username,chatId)=>{
          socket.to(chatId).emit('someone-typing',username)
        })
        socket.on('stop-typing',(username,chatId)=>{
          socket.to(chatId).emit('typing-stopped',username)
        })

        socket.on('disconnect', () => {
            if(!socket.handshake.auth.id) return
            delete onlineUsers[socket.handshake.auth.id]
            io.emit('updateActiveUsers', Object.keys(onlineUsers))
        })


  })


}