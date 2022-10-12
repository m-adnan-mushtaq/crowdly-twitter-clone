const express = require('express')
const router = express.Router()
const upload = require('../config/multer')
const { ensureAuth } = require('../utils/auth')
const { PutObjectCommand } = require('@aws-sdk/client-s3')
const s3Client = require('../config/s3')
const {s3FileUploadHelper}=require('../utils/fileUploadUtils')
const User=require('../models/User')


const baseUploadUrl=process.env.S3_FILE_BASE_URL

//--------------------- UPLOADING PROFILE IMAGE AND TRANSFORMATION to 100 by 100-----------------------------
router.put('/:username/profileImg', ensureAuth, (req, res) => {
    upload(req, res, async err => {
        try {
            if (err) throw err
            let foundUser = await User.findOne({ username: req.params.username })
            if (!foundUser) throw "No User Found!"
            let profileImg = req.files.profileImg[0]
            if (!profileImg) throw "No file found!"
            const {params,fileKey}=await s3FileUploadHelper('profileImg',profileImg,foundUser.profilePic)
            if(!params) throw Error('Credentials Failed!')
            const command = new PutObjectCommand(params)
            let response = await s3Client.send(command)
            if (response.$metadata.httpStatusCode !== 200) throw new Error('Failed to upload file, Try again Later!')
            // now update user profile pic field
            foundUser.profilePic = `${baseUploadUrl}/${fileKey}`
            await foundUser.save()
            res.json({
                code: 201
            })

        } catch (error) {
            console.log(error);
            res.status(403).json({
                error: error.message
            })
        }
    })

})
//--------------------- UPLOADING COVER IMAGE AND TRANSFORMATION-----------------------------
router.put('/:username/coverImg', ensureAuth, (req, res) => {
    upload(req, res, async err => {
        try {
            if (err) throw err
            let foundUser = await User.findOne({ username: req.params.username })
            if (!foundUser) throw "No User Found!"
            let coverImg = req.files.coverImg[0]
            if (!coverImg) throw "No file found!"
            const {params,fileKey}=await s3FileUploadHelper('coverImg',coverImg,foundUser.coverPic)
            const command = new PutObjectCommand(params)
            if(!params) throw Error('Credentials Failed!')
            let response = await s3Client.send(command)
            if (response.$metadata.httpStatusCode !== 200) throw new Error('Failed to upload file, Try again Later!')
            // now update user profile pic field
            foundUser.coverPic = `${baseUploadUrl}/${fileKey}`
            await foundUser.save()
            res.json({
                code: 201
            })

        } catch (error) {
            console.log(error);

            res.status(403).json({
                error: error.message
            })
        }
    })

})






module.exports = router