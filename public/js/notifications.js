const notificationWrapper = document.getElementById('notificationsWrapper')

$(function () {
    //fetch notifications
    fetchNotifications()
    
});


async function fetchNotifications() {
    try {
        notificationWrapper.innerHTML = spinnerHTML
        let response = await getRequestHelper('/api/notifications')
        notificationWrapper.innerHTML = ''

        let notifications = response.notifications
        if (!notifications) {
            throw Error('')
        }

        if (!notifications.length) {
            return notificationWrapper.innerHTML = `<h5 class="fw-bold my-3">
            Nothing  to show here! :)
            </h5>`
        }
        notifications.forEach((notification) => {
            renderNotification(notification)
        })
        markBtn.classList.remove('d-none')
        
    } catch (error) {
        toastr["error"]('Notifications Request!, Try again!')
        notificationWrapper.innerHTML = `<div class='alert alert-danger'>Failed to load notifications, Try again!'</div>`
        // console.error(error);
    }
}

function renderNotification(notification) {


    let { sender, type, entityId, isRead } = notification
    let a = document.createElement('a')
    a.href = notificationLinkHelper(type, entityId)
    a.classList += `notification d-flex   border-bottom border-1 text-black text-decoration-none ${!isRead ? 'unread':' '}`
    a.innerHTML =
    ` <div class=" align-items-center d-flex ">
            <img referrerpolicy="no-referrer" loading="lazy" src="${sender.profilePic}" class="img-rounded rounded-circle align-middle" width="30" height="30" alt="profile pic">
            <div class="ms-2 flex-fill">
                <p >
                    ${sender.username}
                    ${notificationContentHelper(type)}
                </p>
            </div>
        </div>
    `;
    a.dataset.notificationId=notification._id
    if(!isRead){

        a.addEventListener('click',markNotificationAsRead)
    }
     notificationWrapper.append(a)   
}






async function markNotificationAsRead(e) {
    try {
        e.preventDefault()
        let  redirectLink=e.target.href
        // console.log(redirectLink.toString());
        // console.log('put id',e.target.dataset.notificationId);
        await postReqHelper(`api/notifications/${e.target.dataset.notificationId}`,'PUT')
        window.location.href=redirectLink
    } catch (error) {
        // console.log(error)
        toastr['error']('Somthing Went Wrong, Try again!')
    }
   
}
