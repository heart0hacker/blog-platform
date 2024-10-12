const express = require('express');
const BlogPost = require('../models/blogpost');
const Notification = require('../models/notification');
const likeModel = require('../models/likeModel')

const router = express.Router();

// Route to Like a post:
router.post('/blog/:postId/like', async (req, res) => {
    const { postId } = req.params;
    try {
        const post = await BlogPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (!post.likedBy) {
            post.likedBy = [];
        }

        if (post.likedBy.includes(req.user._id)) {
            return res.status(400).json({ message: 'You have already liked this post.' });
        }

        await likeModel.create({postId: postId});
        post.likes += 1;
        post.likedBy.push(req.user._id);
        await post.save();

        const newNotification = new Notification({
            user: post.author,
            type: 'like',
            post: postId,
            fromUser: req.user._id
        });
        await newNotification.save();

        res.status(200).json({ message: 'Post liked successfully.', likes: post.likes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error liking post.' });
    }
});

// Route to Unlike a post:
router.post('/blog/:postId/unlike', async (req, res) => {
    const { postId } = req.params;
    try {
        const post = await BlogPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (!post.likedBy) {
            post.likedBy = [];
        }

        const likedIndex = post.likedBy.indexOf(req.user._id);
        if (likedIndex === -1) {
            return res.status(400).json({ message: 'You have not liked this post.' });
        }

        await likeModel.findOneAndDelete({postId: postId});
        post.likes -= 1;
        post.likedBy.splice(likedIndex, 1);
        await post.save();

        res.status(200).json({ message: 'Post unliked successfully.', likes: post.likes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error unliking post.' });
    }
});

module.exports = router;