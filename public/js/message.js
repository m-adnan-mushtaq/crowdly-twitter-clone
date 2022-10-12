
//------------ GLOBAL VARIABLES DON'T MODIFY IT---------------------------
var chatUsers = []


//--------------------------- handling message modal search input-----------------------
let searchResults = document.querySelector('.search-results')
let groupQueryInput = document.getElementById('groupQueryInput')
let createGroupChatButton = document.getElementById('createGroupChatButton')
let chatMembersContainer = document.querySelector('.chat-members')

if (groupQueryInput) {
    autoSearchHelper(groupQueryInput, searchResultsHelper)
}

async function searchResultsHelper(val) {
    searchResults.innerHTML = spinnerHTML
    try {
        const { foundUsers } = await getRequestHelper(`/api/users/findChatMembers?query=${val}`)
        if (!foundUsers) throw Error('Request Failed, try again!')
        searchResults.innerHTML = ''
        foundUsers.forEach(user => {
            if (chatUsers.some(chatUser => chatUser.username == user.username)) return
            searchResults.append(createUser(user))
        })
        if (searchResults.matches(':empty')) {
            searchResults.innerHTML = `<p class="p-2 fw-bold text-muted">No Users found!,try something else!</p>`
        }
    } catch (error) {
        toastr["error"](error.message)

    }
}



function createUser(user) {
    let div = document.createElement('div')
    div.setAttribute('class', 'search-message-user')
    div.innerHTML = `<div class="d-flex align-items-center px-2 my-1">
        <div class="img-wrapper">
            <img width="50" height="50" src="${user.profilePic}" alt="user" class="rounded-circle">
        </div>
        
        <div class="ms-2 flex-fill">
            <p class="mb-0">${user.name}</p>
            <small> @${user.username}</small>
        </div>
    </div>`;
    div.addEventListener('click', addUserToChatUsers.bind(null, user))
    return div
}



function addUserToChatUsers(user) {
    // check if user already exists
    if (chatUsers.some(chatUser => chatUser.username == user.username)) return
    chatUsers.push(user)
    chatMembersContainer.append(addUserBadge(user))
    createGroupChatButton.disabled=false
}



function addUserBadge(user) {
    let userBadge = document.createElement('h5')
    userBadge.innerHTML = `
    <span class="badge rounded-pill text-bg-extra-light">${user.name} <button onclick="removeUser('${user.username}')" type="button" class="btn-close user-remove-btn" aria-label="Close"></button></span>
    `;
    return userBadge
}
function removeUser(username) {
    chatUsers = chatUsers.filter(user => user.username !== username)
    chatMembersContainer.innerHTML = ''
    chatUsers.forEach(user => {
        chatMembersContainer.append(addUserBadge(user))
    })
    if (!chatUsers.length) {
        createGroupChatButton.disabled=true
    } else {
        createGroupChatButton.disabled=false

    }

}



// onclosing the modal reset all things
document.getElementById('messageModal').addEventListener('hide.bs.modal',()=>{
    chatUsers=[]
    searchResults.innerHTML=''
    chatMembersContainer.innerHTML=''
    groupQueryInput.value=''
    createGroupChatButton.disabled=true
})

//create group chat button
createGroupChatButton.addEventListener('click',async ()=>{
    try{
        if(!chatUsers.length) throw Error('No Users selected, Make sure to select at least one!')
        let usersId=chatUsers.reduce((prev,current)=>{
                let id=current['_id']
                return [...prev,id]
        },[])
        const response=await postReqHelper('/api/users/createChat','POST',
        {
            users:usersId,
            isGroupChat:true
        })
        if(!response.success) throw Error('Invalid Credentials')
        window.location.href=`/messages/${response.chatId}`

    }catch(error){
        toastr["error"]('Invalid Request, Make sure at least one user is selected or same chat does not exists already!')
    }
    //let extract the id's from users
})



