const mongoose = require('mongoose')
const Post = require('../models/Post')
const User = require('../models/User')



const userPopulateParams = {
    path: 'followers following',
    model: 'Follower',
    populate: {
        path: 'follower followee',
        model: 'User',
        populate: {
            path: 'followers following',

        }
    }
}


const postPopulateParams = [
    { path: 'author images' },
    {
        path: 'replyTo',
        model: 'Post',
        populate: {
            path: 'author',
            model: 'User'
        }
    }
]
async function findAndPopulatePosts(query = {}) {
    try {
        let foundPosts = await Post.find(query)
            .populate(postPopulateParams)
            .populate({
                path: 'retweetData',
                model: 'Post',
                populate: postPopulateParams
            })
            .sort({ createdAt: -1 }).exec()
        return foundPosts
    } catch (error) {
        throw new Error(error)
    }
}


async function findSpecificPost(query = {}) {
    try {
        const foundPost = await Post.findOne(query)
            .populate([
                {
                    path: 'author images'
                },
                {
                    path: 'retweetData',
                    populate: 'author images'
                },
                {
                    path: 'replyTo',
                    model: 'Post',
                    populate: {
                        path: 'author',
                        model: 'User'
                    }
                },
                {
                    path: 'replies',
                    model: 'Post',
                    populate: [{
                        path: 'author',
                        model: 'User'
                    },
                    {
                        path: 'replyTo',
                        model: 'Post',
                        populate: {
                            path: 'author',
                            model: 'User'
                        }
                    }]
                }
            ])
            .exec()

        return foundPost
    } catch (error) {
        throw Error(error)
    }
}

function populateUserFields(query = {}) {
    return async (req, res, next) => {
        try {

            let query={}
            if(mongoose.isValidObjectId(req.params.username)){
                console.log('id is valid');
                query={ _id: req.params.username }
            }else{
                console.log('id is not valid search by username');
                query={ username: req.params.username }
            }
            const foundUser = await User.findOne(query)
                .populate(userPopulateParams)
                .exec()
            if (!foundUser) throw "No User Found!"
            req.profileUser = foundUser
            next()
        } catch (error) {
            next(error)
        }
    }
}


async function findRandomUsers(req, res, next) {
    try {
        if (!req.user) throw Error('No User Logged In')

        let randomUsers = await User.aggregate([
            { $match: { username: { $ne: req.user.username } } },
            { $sample: { size: 3 } },
            {
                $lookup: {
                    from: "Follower",
                    localField: '_id',
                    foreignField: 'followee',
                    as: "followers"
                }
            }
        ])
        req.randomUsers = randomUsers
        next()
    } catch (error) {
        next(error)
    }
}


async function listAllUsers(query = {}) {
        try {
            return await User.find(query).populate({
                path: 'followers following',
                model: 'Follower',
            }).exec()
        } catch (error) {
        }
}

async function findPinnPost(query) {
    try {

        const pinnedPost = await Post.findOne(query)
            .populate(postPopulateParams).populate({
                path: 'retweetData',
                model: 'Post',
                populate: postPopulateParams
            })
        return pinnedPost

    } catch (error) {
        throw Error(error)
    }
}

module.exports = { findAndPopulatePosts, findSpecificPost, populateUserFields, findRandomUsers, listAllUsers, findPinnPost }