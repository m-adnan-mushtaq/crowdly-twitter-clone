
document.addEventListener('DOMContentLoaded', () => {
    loader.style.display = 'none';
    updateNotificationBadge()
    updateMessageBadge()
})



var spinnerHTML = `
<div class="text-center my-5">
<div class="spinner-border text-primary " role="status">
    <span class="visually-hidden">Loading...</span>
</div>
</div>
`;

// for toggling sidebar for mobile view
let togglerBtn = document.querySelector('.sm-sidebar-toggler')
let smSidebar = document.querySelector('.sm-sidebar-parent')
togglerBtn.addEventListener('click', () => {
    smSidebar.classList.toggle('active')
})
smSidebarCloseBtn.addEventListener('click', () => {
    smSidebar.classList.remove('active')
})




//------------------search box handling-------------------
let searchBox = document.getElementById('q')
let searchForm = document.getElementById('searchForm')
let searchFilterForm = document.getElementById('searchFilterForm')

if (searchBox) {
    autoSearchHelper(searchBox, persistSearchQuery)
}
function persistSearchQuery(val) {
    if (searchFilterForm) {
        hiddenQuery.value = val
        searchFilterForm.submit()
    } else {
        searchForm.submit()
    }
}





function autoSearchHelper(elm, callback) {
    let searchTime;

    elm.addEventListener('keyup', e => {
        let val = e.target.value.trim()
        if (searchTime) clearTimeout(searchTime)
        if (val == '' || val.length == 0) return
        searchTime = setTimeout(() => {
            val = e.target.value.trim()
            if (val == '' || val.length == 0) {
                return
            }
            callback(val)

        }, 1000);
    })
}


/**
 * 
 * @param {String} title Purpose of Notification
 * @param {String} msg Message you want to display user
 */
function notifyUser(title,msg) {
    const options={
        body:msg,
        icon:'/assets/crowdly-logo.png'
    }
    if (!("Notification" in window)) {
      // Check if the browser supports notifications
    //   alert("This ");
    toastr["info"]('Your Browser does not support desktop notification')

    } else if (Notification.permission === "granted") {
      // Check whether notification permissions have already been granted;
      // if so, create a notification
      const notification = new Notification(options);
      // …
    } else if (Notification.permission !== "denied") {
      // We need to ask the user for permission
      Notification.requestPermission().then((permission) => {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          const notification = new Notification(title,options);
        }
      });
    }else{
        toastr["info"](`${msg}`,title)
    }
  
    // At last, if the user has denied notifications, and you
    // want to be respectful there is no need to bother them anymore.
  }




async function updateNotificationBadge() {
    try {
        let data=await getRequestHelper('/api/notifications/getUnreadNotifications')
        if(data.count==undefined) throw Error('Invalid Response')
        let {count}=data
        if(count==0) return
        //else update relavent badges
        smNotifyWrapper.innerHTML=generateSmBadge(count);
        lgNotifyWrapper.innerHTML=generateLgBadge(count);
    } catch (error) {
        // console.error(error)
        toastr["error"]('Failed to update notification badge, Try again!','Eeeh!')
        
    }
}

async function updateMessageBadge() {
    try {
        let data=await getRequestHelper('/api/messages/getUnreadMessages')
        if(data.count==undefined) throw Error('Invalid Response')
        let {count}=data
        if(count==0) return
        //else update relavent badges
        smMessageWrapper.innerHTML=generateSmBadge(count);
        lgMessageWrapper.innerHTML=generateLgBadge(count);
    } catch (error) {
        // console.error(error)
        toastr["error"]('Failed to update Messages badge, Try again!','Eeeh!')
        
    }
}

function generateSmBadge(count){
    return `<span class="notification-badge badge rounded-pill bg-danger">
             ${count}
            <span class="visually-hidden">unread notifications</span>
            </span>`
}
function generateLgBadge(count) {
    return `
    <span class="notification-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
        ${count}
    <span class="visually-hidden">unread notifications</span>
  </span>
    `
}

async function postReqHelper(url, method, data = {}) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }

        const response = await fetch(url, options)
        if(response.status==204) return 
        return await response.json()
    } catch (error) {
        throw new Error(error)
    }
}


async function getRequestHelper(url) {
    try {
          const response = await fetch(url)
            return await response.json()
    } catch (error) {
        throw new Error(error)
    }
}


function notificationContentHelper(type) {
    let content = ''
    switch (type) {
        case 'Follow':
            content = `started following You!`
            break;
        case 'Like':
            content = `liked your post!`
            break;
        case 'Reply':
            content = `replied to your  post!`
            break;
        case 'Retweet':
            content = `has retweeted your post!`
            break;
        default:
            break;
    }
    return content
}
function notificationLinkHelper(type, entityId) {
    let link = '#'
    if (type == 'Like' || type == 'Retweet' || type == 'Reply') {
        link = `/posts/${entityId}`
    }
    if (type == 'Follow') {
        link = `/user/${entityId}`
    }
    return link
}

/**
 * function generates notifcation string 
 * @param {String} content content of notification 
 * @param {*} user  sender credentials of notification
 * @returns 
 */
 function generateToastString(content,user){
    return `
    <div className="p-2 ">
    ${content} <img width="30" height="30" class="ms-2 rounded-circle" src=${user.profilePic} referrerpolicy="no-referrer"></img>
    </div>`
}