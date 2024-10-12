const express = require('express');
const BlogPost = require('../models/blogpost');
const User = require('../models/User')
const multer = require('multer');
const path = require('path');
const {ensureAuthenticated} = require('../middleware/auth');
const getFeaturedPosts = require('../middleware/getFeaturedPosts');
const flash = require('connect-flash');
const PostView = require('../models/postView');

const router = express.Router();

// Home page route - fetch posts and featured posts
router.get('/', getFeaturedPosts, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page -1) * limit;
        const featuredPosts = req.featuredPosts || [];

        const posts = await BlogPost.find().populate('author', 'username').skip(skip).limit(limit);
        const totalPosts = await BlogPost.countDocuments();
        const totalPages = Math.ceil(totalPosts/limit);

        res.render('home', { 
            posts,
            featuredPosts,
            currentPage: page,
            totalPages,
            user: req.user ,
            query: req.query
        });
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        req.flash('error_msg', 'Unable to fetch posts.');
        res.redirect('/error');  // Redirect to a custom error page
    }
});

// Configure Multer Storage:
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

// Validate the file type
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp4|mkv|avi/;  // allowed file types
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());  // check extension
    const mimetype = filetypes.test(file.mimetype);  // check mimetype

    if (mimetype && extname) {
        return cb(null, true);  // file is valid
    } else {
        cb(new Error('File type not supported'));  // file is invalid
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // limit file size to 10MB
});

// Create a new BlogPost (GET):
router.get('/blog/create', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('create', { user: req.user });
    } else {
        res.redirect('/login');
    }
});

// Create a new BlogPost (POST with Image):
router.post('/blog/create', ensureAuthenticated , upload.single('media'), (async (req, res) => {
    const { title, content, media, tags, category } = req.body;
        try {
            const tagsArray = tags ? tags.split(',').map(tag=>tag.trim()) : []
            const newPost = new BlogPost({
                title,
                content,
                author: req.user._id,
                media: req.file ? req.file.filename : null,
                tags: tagsArray,
                category,
            });
            await newPost.save();
            res.redirect('/dashboard');
        } catch (error) {
            console.error(error);
            res.redirect('/blog/create');
        }
}));

// Route to display blog posts:
router.get('/blog', async (req, res) => {
    try {
        const post = await BlogPost.find().populate('author', 'username'); // Populate author information
        res.render('blog', { post, user: req.user });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

// Route to display a specific blog post:
router.get('/blog/:id', async (req, res) => {
    try {
        const postId = req.params.id;

        const post = await BlogPost.findById(postId)
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    model: 'User',
                    select: 'username'
                }
            })
            .populate({
                path: 'comments',
                populate: {
                    path: 'replies',
                populate: {
                    path: 'author',
                    model: 'User',
                    select: 'username'
                }
            }
            })
            .populate('author', 'username');

        if (!post) {
            req.flash('error_msg', 'Post not found.');
            return res.redirect('/');
        }

        await PostView.create({postId: postId});
        post.views += 1;
        await post.save();
        const shareableUrl = `${req.protocol}://${req.get('host')}/blog/${post._id}`;

        // Render the blog post along with the shareable URL
        res.render('blog', { post, user: req.user, shareableUrl });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error loading post.');
        res.redirect('/');
    }
});

// Route to edit a blog post (GET):
router.get('/blog/edit/:id', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const post = await BlogPost.findById(req.params.id);
            if (post.author.toString() === req.user._id.toString()) {  // Check if the logged-in user is the author
                res.render('editPost', { post });
            } else {
                res.redirect(`/blog/${req.params.id}`);
            }
        } catch (error) {
            console.error(error);
            res.redirect(`/blog/${req.params.id}`);
        }
    } else {
        res.redirect('/login');
    }
});

// Route to edit a blog post (POST):
router.post('/blog/edit/:id', async (req, res) => {
    const { title, content, category, tags } = req.body;
    try {
        await BlogPost.findByIdAndUpdate(req.params.id, { title, content, category, tags });
        res.redirect(`/blog/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.redirect(`/blog/${req.params.id}`);
    }
});

// Route to delete a blog post:
router.post('/blog/delete/:id', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const post = await BlogPost.findById(req.params.id);
            if (!post) {
                req.flash('error_msg', 'Post not found.');
                return res.redirect('/dashboard');
            }

            if (post.author.toString() === req.user._id.toString()) {
                await BlogPost.findByIdAndDelete(req.params.id);
                req.flash('success_msg', 'Post deleted successfully.');
                res.redirect('/dashboard');
            } else {
                req.flash('error_msg', 'You are not authorized to delete this post.');
                res.redirect(`/blog/${req.params.id}`);
            }
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error deleting post.');
            res.redirect(`/blog/${req.params.id}`);
        }
    } else {
        res.redirect('/login');
    }
});

// Route to bookmark posts:
router.post('/bookmark/:id', ensureAuthenticated, async (req, res) => {
    try {
        const postId = req.params.id;
        const user = await User.findById(req.user._id);

        // Check if already bookmarked
        if (!user.bookmarks.includes(postId)) {
            await User.findByIdAndUpdate(req.user._id, { $push: { bookmarks: postId } });
            req.flash('success_msg', 'Post bookmarked successfully!');
            res.status(200).json({ success: true, message: 'Post bookmarked successfully!' }); // Send response back
        } else {
            req.flash('error_msg', 'Post is already bookmarked!');
            res.status(400).json({ success: false, message: 'Post is already bookmarked!' }); // Send error response
        }
    } catch (error) {
        console.error("Error bookmarking post: ", error.message);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
});

// Unbookmark route
router.delete('/bookmark/:id', ensureAuthenticated, async (req, res) => {
    try {
        const postId = req.params.id;
        const user = await User.findById(req.user._id);

        if (user.bookmarks.includes(postId)) {
            user.bookmarks.pull(postId);
            await user.save();
            req.flash('success_msg', 'Post unbookmarked successfully!');
            res.status(200).json({ success: true, message: 'Post unbookmarked successfully!' }); // Send response back
        } else {
            req.flash('error_msg', 'Post is not bookmarked!');
            res.status(400).json({ success: false, message: 'Post is not bookmarked!' }); // Send error response
        }
    } catch (error) {
        console.error("Error unbookmarking post: ", error.message);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
});

module.exports = router;