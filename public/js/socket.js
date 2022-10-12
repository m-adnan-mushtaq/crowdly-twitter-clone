


socket.emit('connected',loggedUser._id)

socket.on('connect_error',err=>{
    console.error(err);
    toastr["error"]('Socket Connection Failed, Try again!')
    
})

socket.on('message-recieved',msg=>{
    if(!msg) return
    //check if user is currently on chat page
    let findRelevantChat=document.querySelector(`ul[data-chat-room="${msg.chat}"]`)
    if(findRelevantChat){

        renderMessageHTMl(msg,null,null)
    }else{

        let content=generateToastString(msg.content,msg.sender)
        toastr["info"](content,'New Message',{
            timeOut:5000,
            iconClass:'customToast',
            onclick:function(){
                window.location.href=`/messages/${msg.chat}`
            }
        })
    }
})


socket.on('update-message-badge',updateMessageBadge)

socket.on('new-notification',(notification)=>{
        if(!notification) return
        //refresh notification badge
        updateNotificationBadge()

        //check if user is on notification page
        const notificationWrapper = document.getElementById('notificationsWrapper')
        if(notificationWrapper){
            fetchNotifications()
        }

        let content=notificationContentHelper(notification.type)
        let link=notificationLinkHelper(notification.type)
        let msg=generateToastString(content,notification.sender)
        toastr["info"](msg,`Update from ${notification.sender.username}`,{
            timeOut:5000,
            iconClass:'customToast',
            onclick:function(){
                window.location.href=link
            }
        })
})

