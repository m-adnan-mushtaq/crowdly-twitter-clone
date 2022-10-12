
//------------- VARIALBES------------
const activeChat = JSON.parse(currentChat)
const activeChatUsersIds=activeChat.users.map(user=>user._id.toString())
const chatMessagesContainer = document.querySelector(`ul[data-chat-room="${activeChat._id}"]`)
let emptyChatIndicator=document.querySelector('.empty-chat-indicator')
let { _id, id, username } =(loggedUser)
const apiUrl = `/api/messages/${activeChat._id}`
const usersHashMap = {}
const usersListWrapper = document.getElementById('usersListWrapper')
var isTyping=false
var previousTyper;
var maxTypingMS=3000;


updateTitleBtn.addEventListener('click', e => {
    e.stopPropagation()
})



chatMessagesContainer.innerHTML = spinnerHTML
$(function () {
    //fetch message
    fetchMessages()
    showUsersList()
    joinRoom()

});


// send message 
//---------------------- message credentials-------------------------
messageForm.addEventListener('submit', e => {
    e.preventDefault()
    let senderId = senderIdInput.value
    let chatId = chatIdInput.value
    let content = messageInput.value
    content = content.trim()
    if (!senderId || !chatId || !content) return

    //extract the common users b/w online and activeChat users
    let onlineUsersSet=new Set(Object.keys(usersHashMap).filter(key=>usersHashMap[key]['status']))
    let chatUsersSet=new Set(activeChatUsersIds)
    let activeChatOnlineUsers=[...intersection(onlineUsersSet,chatUsersSet)]
    sendMessage({ senderId, chatId, content,activeChatOnlineUsers})
    if(isTyping ){
        updateStopTypingStatus()
         
     }
})

messageInput.addEventListener('keydown',e=>{
    //update others online users about  typing status
        isTyping=true
        notifyTypingOthers()
})

messageInput.addEventListener('blur',updateStopTypingStatus)
/**
 * handles rendering message in chat inbox with appropirate styles
 * @param {String} message message you want to render must contains valid body and sender info
 * @param {*} nextMsgSenderId id of next message sender id to apply special styles
 * @param {*} lastSenderId id of previous message sender id to apply special styles
 */
function renderMessageHTMl(message, nextMsgSenderId, lastSenderId) {
    let curretSenderId = message.sender.id
    let sender = message.sender
    let li = document.createElement('li')
    li.classList.add('message')
    //check if message is of logged user
    let loggedUserMsg = curretSenderId == id
    let messageAuthorClass = loggedUserMsg ? 'mine' : 'theirs'
    li.classList.add(messageAuthorClass)
    //now check if user has multiple messages
    let htmlString = ''
    let senderNamestr = ''
    let isFirst = curretSenderId != lastSenderId
    if (isFirst) {
        li.classList.add('first')
        if (!loggedUserMsg) senderNamestr = `<span class='senderName'>${sender.username}</span>`
    }
    let isLast = curretSenderId != nextMsgSenderId
    if (isLast) {
        li.classList.add('last')
        if (!loggedUserMsg) {
            htmlString += `<div class='imageContainer'>
            <img src='${sender.profilePic}' alt='${sender.username}'></img>
        </div>`
        }
    }



    li.innerHTML = htmlString + `
    <div class='messageContainer'>
        ${senderNamestr}
        <span class='messageBody'>
             ${message.content}
        </span>
    </div>`
    chatMessagesContainer.appendChild(li)
}


async function sendMessage(message) {
    try {
        let response = await postReqHelper(apiUrl, 'POST', message)
        if (!response.success || !response.message) {
            toastr["error"]('Failed to send Message, Try again!')
            return
        }
        messageInput.value = ''
        const sentMessage=response.message

        //check if empty chat indicaotor is visible then hide it

        renderMessageHTMl(sentMessage, null, null)
        
        isTyping=false
        
        socket.emit('message-sent',sentMessage,activeChatUsersIds)
        scrollToBottom();
        

    } catch (error) {
        toastr["error"]('Invalid Credentials, Try again!')
        // console.error(error);
    }
}

async function fetchMessages() {
    try {
        let response = await getRequestHelper(apiUrl)
        chatMessagesContainer.innerHTML = ''

        if (!response.messages) throw Error('failed')
        let lastSenderId = null
        let messages = response.messages

        messages.forEach((msg, i) => {
            let nextMsgSenderId = (messages[i + 1]) ? (messages[i + 1].sender.id) : null
            renderMessageHTMl(msg, nextMsgSenderId, lastSenderId)
            lastSenderId = msg.sender.id
        })
        scrollToBottom();

        markAllMessageRead()
    } catch (error) {
        toastr["error"]('Messages request failed!, Try again!')
        chatMessagesContainer.innerHTML = `<div class='alert alert-danger'>Failed to load messages, Try again!'</div>`

        // console.error(error);
    }
}


//JQERY scroll animation functin copied!
function scrollToBottom() {
    $('#messagesWrapper').stop().animate({
        scrollTop: $('#messagesWrapper')[0].scrollHeight
    }, 800);
}

function showUsersList() {
    //update hashmap
    if (!activeChat.users.length) return
    activeChat.users.forEach(user => {
        usersHashMap[user.id]={}
        usersHashMap[user.id]['credentials'] = user
        usersHashMap[user.id]['status'] = false
    })

    //now update dom
    updateUserList()
}



function updateUserList() {
    let htmlStr = ''
    let user;
    let status;

    for (const key in usersHashMap) {
        user = usersHashMap[key]['credentials']
        status =usersHashMap[key]['status']
        htmlStr += `
        <a href="/user/${user.username}" class="text-decoration-none  text-dark-grey">
        <div class="d-flex align-items-center px-2 my-1 user-sample">
                <div class="img-wrapper">
                    <img width="50" referrerpolicy="no-referrer" height="50" src="${user.profilePic}" alt="user" class="rounded-circle">
                </div>
                <div class="ms-2 flex-fill ">
                    <p class="mb-0">${user.id==id?'You':user.username}</p>
                </div>
                <div>
                <span class="status fw-bold ${status?'online':'offline'}">
                    ${status?'Online':'Offline'}
                </span>
                </div>
                
        </div>
        </a>
        `
    };
    usersListWrapper.innerHTML = htmlStr
}

function joinRoom() {
    socket.emit('join-chat',activeChat._id,id,updateActiveUsersHelper)
}


//update status
socket.on('updateActiveUsers',newUserIds=>{
    //check if hash map contains it
    for (const key in usersHashMap) {
        usersHashMap[key]['status']=false
    }
    updateActiveUsersHelper(newUserIds)  
})

/**
 * function that update the stats from offline to online
 * @param {Array} newUserIds  pass all id's of chat users
 */
function updateActiveUsersHelper(newUserIds) {
    //make all users offline first
    newUserIds.forEach(id=>{
        if(usersHashMap[id]){
            usersHashMap[id]['status']=true
        }
    })

    updateUserList()
}


function showTypingStatus(username) {
    let li=document.createElement('li')
    li.classList += 'p-2 fw-bold text-dark-grey bg-extra-light d-inline-block rounded-pill typing'
    li.dataset.username=username
    li.style.minWidth='180px'
    li.style.maxWidth='180px'
    li.style.overflow='hidden'
    li.innerHTML=` ${username} is typing`
    return li
}


let previousTimeout;
function notifyTypingOthers() {
    if(previousTimeout) clearTimeout(previousTimeout)
    previousTimeout=setTimeout(() => {
        if(isTyping){
            updateStopTypingStatus()
        }
    }, maxTypingMS);
    
    if(isTyping){
        socket.emit('notify-typing',loggedUser.username,activeChat._id)
    }
}



socket.on('someone-typing',username=>{
    if(previousTyper==username) return
    chatMessagesContainer.append(showTypingStatus(username))
    previousTyper=username
    scrollToBottom()

})
socket.on('typing-stopped',username=>{
    let typingBadge=document.querySelector(`li[data-username="${username}"]`)
    if(typingBadge){
        typingBadge.remove()
    }
    previousTyper=undefined
})


function updateStopTypingStatus() {
    socket.emit('stop-typing',loggedUser.username,activeChat._id)
    if(isTyping) isTyping=false
}


async function markAllMessageRead() {
    try {
        await postReqHelper(`/api/messages/${activeChat._id}/markRead`,'PUT')
    } catch (error) {
        // console.error(error)
        toastr["error"]('Something Went Wrong!, Try again!')
        
    }
}

function intersection(set1,set2) {
    const interSet=new Set()
    // we have to add both set common elements
    for (const elm of set1) {
        if (set2.has(elm)) {
            interSet.add(elm)
        }
    }
    return interSet
    // time complexity is O(n)
}