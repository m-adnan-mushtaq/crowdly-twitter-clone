var cropper;
let profileCropModal = document.getElementById('profileCropModal')

let followerBtns = document.querySelectorAll('.follow-btn')
if (followerBtns.length) {
    followerBtns.forEach(btn => {
        btn.addEventListener('click', e => {
            btn.disabled=true
            let targetFollowId = btn.dataset.userId
            if (!targetFollowId) {
                toastr["error"]('Failed to get follow id!')
                return

            }
            let span = document.querySelector('.followers-count')
            let followText = btn.querySelector('.follow-text')
            postReqHelper(`/user/${targetFollowId}/follow`, 'PUT').then(res => {
                btn.disabled=false
                if(!res.count){
                    toastr["error"]('Request Failed!, try again!')
                    return
                }
                let count = parseInt(res.count)
                if (span) {
                    span.innerText = parseInt(span.innerText) + count
                }
                if (count == -1) {
                    followText.innerText = 'Follow'
                    btn.classList.remove('active')
                } else {
                    followText.innerText = 'Following'
                    btn.classList.add('active')
                }
            }).catch(e => {
                toastr["error"]('invalid request, try again!')
                btn.disabled=false
                // console.log(e.message);
            })
        })
    })
}
const picForm = new FormData()
let coverImgUploadBtn = document.getElementById('coverImgUploadBtn')
if (coverImgUploadBtn) {
    triggerFileInput(coverImgInput, coverImgUploadBtn)
    coverImgInput.addEventListener('change', e => {

        let targetFile = e.target.files[0]
        if(!targetFile) return
        if((targetFile.size/1000000)>5){
            toastr["error"]('File Size is too large, Max upto 5MB')
            return
        }
        // check mimetype
        let allowedMimeTypes = /jpeg|jpg|gif|png/
        if (!allowedMimeTypes.test(targetFile.type)) {
            toastr["warning"]('Invalid file type! only images!')
            return
        }
        openCropModal(targetFile, profileCropModal, 16 / 9)
        // set the data-target so handle the url correctly
        profileCropModal.dataset.field='coverImg'
        profileCropModal.dataset.userName=coverImgUploadBtn.dataset.userName


    })


}
let profileImgUploadBtn = document.getElementById('profileImgUploadBtn')
if (profileImgUploadBtn) {
    triggerFileInput(profileImgInput, profileImgUploadBtn)
    profileImgInput.addEventListener('change', e => {

        let targetFile = e.target.files[0]
        if(!targetFile) return
        if((targetFile.size/1000000)>5){
            toastr["error"]('File Size is too large, Max upto 5MB')
            return
        }
        // check mimetype
        let allowedMimeTypes = /jpeg|jpg|gif|png/
        if (!allowedMimeTypes.test(targetFile.type)) {
            toastr["warning"]('Invalid file type! only images!')
            return
        }
        openCropModal(targetFile, profileCropModal, 1 / 1)
        profileCropModal.dataset.field='profileImg'
        profileCropModal.dataset.userName=profileImgUploadBtn.dataset.userName

    })
}
function triggerFileInput(fileInput, button) {
    button.addEventListener('click', () => {
        fileInput.click()
    })
}

function openCropModal(targetFile, modal, ratio) {
    const myModal = new bootstrap.Modal(modal)
    myModal.show()
    modal.addEventListener('shown.bs.modal', () => {
        const reader = new FileReader()
        reader.onloadstart=()=>{
            if(cropper){
                cropper.reset()
            }
        }
        reader.onload = e => {
            cropImg.src = e.target.result;
            if(cropper){
                cropper.destroy()
            }
            cropper = new Cropper(cropImg, {
                aspectRatio: ratio,
                minContainerHeight: 240,
                autoCropArea:0.95
            })
        }
        reader.readAsDataURL(targetFile)
    })
    modal.addEventListener('.hide.bs.modal',()=>{
        cropper.destroy()
        cropImg.src=''
    })
    customRange1.addEventListener('change',e=>{
        cropper.zoom(parseFloat(e.target.value))
    })
}

let updatePicBtn=document.querySelector('.updatePicBtn')
updatePicBtn.addEventListener('click',e=>{
    if(!cropper) return
    const canvasData = cropper.getCroppedCanvas();
    canvasData.toBlob(blob=>{

        let fieldname=profileCropModal.dataset.field
        let username=profileCropModal.dataset.userName

        if(!fieldname || !username) {
            toastr["warning"]('Failed to update relevant fields')
            return 
        }
        picForm.append(fieldname,blob)
        let apiUrl=`/user/upload/${username}/${fieldname}`;
        updatePicBtn.disabled=true
        updatePicBtn.innerHTML=`
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Uploading...`;
        fetch(apiUrl,{
            method:'PUT',
            body:picForm
        }).then(res=>res.json()).then(data=>{
            if(data['error']){
                throw Error(data['error'])
            }
            const code=data.code
            if(code==201){
                location.reload(true)
            }
        }).catch(e=>{
            toastr["error"]('Failed, Invalid Crenentials, Try again!')
            updatePicBtn.disabled=false
            updatePicBtn.innerHTML=`Apply`
            // console.log(e.message);
        })
    })
})


