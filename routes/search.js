const express= require('express');
const BlogPost = require('../models/blogpost');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.get('/search', async(req, res)=>{
    const query = req.query.query;
    const limit = 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const post = await BlogPost.find({
        $or: [
            {title: {$regex: query, $options: 'i'}},
            {tags: {$regex: query, $options: 'i'}},
            {category: {$regex: query, $options: 'i'}}
        ]
    }).populate('author', 'username').skip(skip).limit(limit);

    const authorMatches = await BlogPost.find().populate({
        path: 'author',
        match: { username: { $regex: query, $options: 'i' } }
    });

    const combinedResults = [...post, ...authorMatches].filter((post, index, self) =>
        post.author && index === self.findIndex((p) => p._id.toString() === post._id.toString())
    );
    
    res.render('search-results/search-results', {post: combinedResults, query})
});

router.get('/bookmarks/search', ensureAuthenticated, async(req, res)=>{
    const query = req.query.query;
    try {
    const user = await User.findById(req.user._id).populate({
        path: 'bookmarks',
        match: {
            $or: [
                {title: {$regex: query, $options: 'i'}},
                {tags: {$regex: query, $options: 'i'}},
                {category: {$regex: query, $options: 'i'}}
            ]
        }
    })

    res.render('search-results/bookmarked-search-results', { bookmarks: user.bookmarks, query });
} catch (error) {
    console.error("Error searching bookmarked posts: ", error);
    req.flash('error_msg', 'Could not search bookmarks. Please try again.');
    res.redirect('/bookmarks');
}
});

module.exports = router;