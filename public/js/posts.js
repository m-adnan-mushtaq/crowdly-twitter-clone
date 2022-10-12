let likeBtns = document.querySelectorAll('.like-btn')
if (likeBtns.length) {
    //  iterate over each button
    likeBtns.forEach(btn => {
        // add event listener
        btn.addEventListener('click', e => {
            let targetLikeBtn = btn
            let targetPostId = targetLikeBtn.closest('.post-wrapper').dataset.likePostId?targetLikeBtn.closest('.post-wrapper').dataset.likePostId:targetLikeBtn.closest('.post-wrapper').dataset.postId
            if(!
            targetPostId) {
            toastr["error"]('Failed to get target post!')
                return
            }
            let targetSpan = findNestedClosestElementHelper(targetLikeBtn,'.post-wrapper','span.heart-span')
            let targetCheckBox = targetLikeBtn.querySelector('input')
            btn.disabled=true
            postReqHelper(`/posts/${targetPostId}/like`, 'PUT').then(response => {
                btn.disabled=false
                // if liked post already
                if (response.isLiked) {
                    targetCheckBox.checked = true
                } else {
                    targetCheckBox.checked = false
                }
                targetSpan.innerHTML = response.likesCount || ''
                
            }).catch(e => {
                // console.log(e.message);
                toastr["error"]('Invalid Request, Try again!')
                btn.disabled=false
            })
        })  
    })
}

//----------------- add events to retweet modal-------------------------------
let retweetModal=document.getElementById('retweetModal')
if (retweetModal) {
    modalEventsHandler(retweetModal)
}




//------------ for retweeting handling modals -------------------------------------
let retweetModalBtns = document.querySelectorAll('.retweet-modal-btn')
if (retweetModalBtns.length) {
    setPostIdToModal(retweetModal,retweetModalBtns,'#retweetTargetPostId')
}

//----------------- add events to rply modal-------------------------------
let replyModal=document.getElementById('rplyModal')
if (replyModal) {
    modalEventsHandler(replyModal)
}
const rplyBtns=document.querySelectorAll('.rply-btn')
if (rplyBtns.length) {
    setPostIdToModal(replyModal,rplyBtns,'#rplyTargetPostId')
}

let deleteModal=document.getElementById('deleteModal')

//--------- delete post id-------------------
const deleteBtns=document.querySelectorAll('.delete-btn')
if (deleteBtns.length) {
    setPostIdToModal(deleteModal,deleteBtns,'#deletPostIdInput')
}


//------------- PINNED POST BUTTONS-------------
const pinnModal=document.getElementById('pinnPostModal')
const pinnBtns=document.querySelectorAll('.pin-btn')
if (pinnBtns.length) {
    setPostIdToModal(pinnModal,pinnBtns,'#pinnPostIdInput')
}


//------------- UNPINNED POST BUTTONS-------------
const unPinnModal=document.getElementById('UnPinnPostModal')
const unPinnBtns=document.querySelectorAll('.unpin-btn')
if (unPinnBtns.length) {
    setPostIdToModal(unPinnModal,unPinnBtns,'#unPinnPostIdInput')
}

// get the target post from server handler
function fetchPostForModal(modal) {
    // show spinner firstly  
    let postModalWrapper=modal.querySelector('.post-modal-wrapper')
    postModalWrapper.innerHTML=`
    <div class="text-center">
        <div class="spinner-border  text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    `;
    let url= '/api/posts/'+modal.dataset.postId
    // get the post
    getRequestHelper(url).then(res=>{
        let post=res.post
        postModalWrapper.innerHTML=renderPost(post)
    }).catch(e=>{
        toastr["error"]('Failed to fetch, Try again!')
    })

}

// on show and hide modal events fire handler

function modalEventsHandler(modal) {
    let postModalWrapper=modal.querySelector('.post-modal-wrapper')
    modal.addEventListener('shown.bs.modal',()=>{ 
        fetchPostForModal(modal)
    })
    modal.addEventListener('hide.bs.modal',()=>{ 
        postModalWrapper.innerHTML=''
    })
}

// set the post of target btn parent handler
function setPostIdToModal(modal,btnsList,targetElm) {
    // node must be an array
    btnsList.forEach(btn=>{
        btn.addEventListener('click', e => {
            let targetPostId = getPostIdHelper(btn)
            modal.dataset.postId = targetPostId
            // set the hidden input value of target post id
            document.querySelector(targetElm).value=targetPostId
        })
    })
}

// util function for getting post id of target
function getPostIdHelper(target) {
    let targetPostId= target.closest('.post-wrapper').dataset.postId
    if(!targetPostId){
        return
    }
    return targetPostId
}

function findClosetElementHelper(elm,target) {
    return elm.closest(target)
}
function findNestedClosestElementHelper(elm,parent,child) {
    return elm.closest(parent).querySelector(child)
}


function renderPost(post) {
    let postHTML=''
    //so if post is a retweet post then change the post to retweet post
    if(post.retweetData && post.retweetData._id){
        post=post.retweetData
    }
    if (post.replyTo && post.replyTo._id) {
        postHTML +=`
        <p class="text-dark-grey">
        <i>
            Replying to <a class="link-primary text-decoration-none" href="#">@${post.replyTo.author.username}</a></a>
        </i>
    </p>
        `
    }
    postHTML +=`
    <div class="post-wrapper pt-2" data-post-id="${post._id}">
        <div class="post-header d-flex align-items-center mb-1">
        <div class="img-wrapper d-flex flex-fill align-items-center">
            <div>
                <img referrerpolicy="no-referrer" src="${post.author.profilePic}" class="img-rounded rounded-circle align-middle" width="50" height="50" alt="profile pic">
            </div>
            <div class="ms-2">
                <p class="text-dark-grey ms-1 mb-0 fw-bold">${post.author.name}</p>
                <small class="text-muted">@${post.author.username}</small>
            </div>
        </div>
        <small class="text-muted">
           ${post.uploadedAt}
        </small>
        </div>
            <div class="post-content  p-1">
                <div class="content">
                    <p>${post.content} </p>
                </div>
    `;

    // now if post contains any images then
    if (post.images.length) {
        let imagesHTML='<div class="post-image-box">'
        post.images.forEach(imgDoc=>{
            imagesHTML+=`<div class="post-image-wrapper">
            <img loading="lazy" src="${imgDoc.imgUrl}" alt="${post.author.name}">
        </div>`
        })
        postHTML+=imagesHTML+'</div>'
    }
    return postHTML+'</div>'
}


let filterInputs=document.querySelectorAll('#searchNewsFeedForm input')
if(filterInputs.length){

    filterInputs.forEach(input=>{
        input.addEventListener('change',e=>{
            searchNewsFeedForm.action=`/posts?pf=${e.target.value}`
            searchNewsFeedForm.submit()
        })
    })
}