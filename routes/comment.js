const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../middleware/auth');
const BlogPost = require('../models/blogpost');
const Comment = require('../models/comment');
const Notification = require('../models/notification');
const commentModel = require('../models/commentModel');

// Route to add a comment:
router.post('/blog/:id/comment', async (req, res) => {
    const { text } = req.body;
    const postId = req.params.id;
    if (req.isAuthenticated()) {
        if (!text) {
            req.flash('error_msg', 'Comment text is required.');
            return res.redirect(`/blog/${req.params.id}`);
        }

        try {
            const post = await BlogPost.findById(postId);

            if (!post) {
                req.flash('error_msg', 'Post not found.');
                return res.redirect('/');
            }

            const newComment = new Comment({
                text,
                author: req.user._id,
                createdAt: new Date(),
            });

            await newComment.save();

            if (!post.comments) {
                post.comments = [];
            }
            post.comments.push(newComment._id);

        await commentModel.create({postId: postId});
            post.commentsCount += 1;
            await post.save();

            const newNotification = new Notification({
                user: post.author,
                type: 'comment',
                post: postId,
                fromUser: req.user._id
            });
            await newNotification.save();

            res.redirect(`/blog/${req.params.id}`);
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error adding comment.');
            res.redirect(`/blog/${postId}`);
        }
    } else {
        res.redirect('/login');
    }
});

// Route to reply to a comment
// Route to reply to a comment
router.post('/blog/:postId/comment/:commentId/reply', ensureAuthenticated, async (req, res) => {
    try {
        const { text } = req.body;
        const commentId = req.params.commentId;

        if (!text || text.trim() === "") {
            return res.status(400).json({ error: 'Text is required.' });
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            req.flash('error_msg', 'Comment not found.');
            return res.redirect(`/blog/${req.params.postId}`);
        }

        const newReply = {
            text: text,
            author: req.user._id,
            createdAt: new Date()
        };

        comment.replies.push(newReply);
        await comment.save();

        // Optionally create a notification for the comment's author
        const newNotification = new Notification({
            user: comment.author,
            type: 'reply',
            post: req.params.postId,
            fromUser: req.user._id
        });
        await newNotification.save();

        res.redirect(`/blog/${req.params.postId}`);
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error adding reply.');
        res.redirect(`/blog/${req.params.postId}`);
    }
});

// Route to delete a comment:
router.delete('/blog/:postId/comment/:commentId', async (req, res) => {
    const { postId, commentId } = req.params;
    try {
        const post = await BlogPost.findById(postId);
        if (!post) {
            req.flash('error_msg', 'Post not found.');
            return res.redirect('/');
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            req.flash('error_msg', 'Comment not found.');
            return res.redirect(`/blog/${postId}`);
        }

        if (comment.author.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'You are not authorized to delete this comment.');
            res.redirect(`/blog/${postId}`)
        }
        post.comments.pull(commentId);
        post.commentsCount -= 1;
        await post.save();

        await Comment.findByIdAndDelete(commentId);
        req.flash('success_msg', 'Comment deleted successfully.');
        res.redirect(`/blog/${postId}`);
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error deleting comment.');
        res.redirect(`/blog/${postId}`);
    }
});

// Route to edit comment:
router.get('/blog/:postId/comment/:commentId/edit', async (req, res) => {
    const { postId, commentId } = req.params;
    try {
        const post = await BlogPost.findById(postId);
        const comment = await Comment.findById(commentId);
        if (!post || !comment) {
            req.flash('error_msg', 'Post or comment not found.');
            return res.redirect(`/blog/${postId}`)
        }

        if (comment.author._id.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'You are not authorized to edit this comment.');
            res.redirect(`/blog/${postId}`);
        }

        res.render('editComment', { post, comment, user: req.user });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error loading comment edit page.');
        res.redirect(`/blog/${postId}`);
    }
});

router.put('/blog/:postId/comment/:commentId', async (req, res) => {
    const { postId, commentId } = req.params;
    const { text } = req.body;
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            req.flash('error_msg', 'Comment not found');
            res.redirect(`/blog/${postId}`);
        }

        if (comment.author._id.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'You are not authorized to edit this comment.');
            return res.redirect(`/blog/${postId}`);
        }

        comment.text = text;
        await comment.save();
        req.flash('success_msg', 'Comment updated successfully.');
        res.redirect(`/blog/${postId}`);
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error updating comment.');
        res.redirect(`/blog/${postId}`);
    }
});

module.exports = router;