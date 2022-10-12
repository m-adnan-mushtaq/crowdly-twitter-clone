
const PostImg = require('../models/PostImg')
const crypto = require('crypto')
const sharp = require('sharp')



const s3Buket = process.env.S3_BUCKET_NAME
const uploadUrlRegex = process.env.S3_URL_REGEX

function generatekey() {
    return crypto.randomBytes(32).toString('hex')
}
function urlChecker(imgUrl) {
    let regex = new RegExp(`${uploadUrlRegex}`, 'i')
    return regex.test(imgUrl)
}
// function that will take care of bufferin image handlers

async function bufferMultipleImagesHelper(doc, images) {

    // iterate over each image and buffer it and store it
    if (!images.length) return
    if (!doc) return
    try {
        let bufferImgDocs = []
        let isValid = true
        images.forEach(img => {
            let postImgDoc = {}
            let imageMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
            if (img != null && imageMimeTypes.includes(img.type)) {
                // creating buffer of base 64 string
                postImgDoc.data = Buffer.from(img.data, 'base64')
                postImgDoc.mimeType = img.type
                postImgDoc.post = doc._id
                bufferImgDocs.push(postImgDoc)
                isValid = imageMimeTypes.includes(img.type) && isValid
            }
        })
        // now insert images into postImg collections and grab all id's
        if (!isValid) {
            throw new Error('Invalid File Type detected!')
        }
        let insertedImgs = await PostImg.insertMany(bufferImgDocs)
        // extract the id's of images
        insertedImgs = insertedImgs.map(({ _id }) => _id)
        return insertedImgs

    } catch (error) {
        console.log(error.message);
        throw new Error(error)
    }


}

//------------------ s3 bucket file upload helper----------------------------------------------
async function s3FileUploadHelper(fileField,currentFile,previousPicUrl) {
    try {
        if (!currentFile) throw Error("No file found!")
        let sharpOptions={
            background: 'black', fit: 'cover', gravity: 'center center',width:100,height:100
        }
        // now if file is coverImg then
        if (fileField =='coverImg') {
            sharpOptions.width=1280;
            sharpOptions.height=720;
        }
        let compressedPic = await sharp(currentFile.buffer)
            .rotate()
            .resize(sharpOptions)
            .toBuffer()
        // now pic is resized now it's time to put in the s3 bucket
            let fileKey = `crowdlyDB/${fileField}/${generatekey()}.${currentFile.mimetype.split('/')[1]}`
            let isUploaded = urlChecker(previousPicUrl)
            if (isUploaded) {
                // then get the key and update it
                fileKey = previousPicUrl.split('/').slice(3).join('/')
            }
        const params={
            Bucket: s3Buket,
            ACL: 'public-read',
            Key: fileKey,
            Body: compressedPic,
            ContentType: currentFile.mimetype
        }
        console.log(fileKey);
        return {params,fileKey};
    } catch (error) {
        throw Error(error)
    }

}
module.exports={bufferMultipleImagesHelper,s3FileUploadHelper}