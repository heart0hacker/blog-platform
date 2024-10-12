const express = require('express');
const BlogPost = require('../models/blogpost');
const {ensureAuthenticated} = require('../middleware/auth');
const { getPostAnalytics } = require('../controllers/analyticsController'); 
const router = express.Router();

// Dashboard route to show user-specific blogs
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.pages) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const posts = await BlogPost.find().populate('author', 'username').skip(skip).limit(limit);
        const totalPosts = await BlogPost.countDocuments();
        const totalPages = Math.ceil(totalPosts/limit);
        
        res.render('dashboard', {
            posts,
            user: req.user,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Unable to load dashboard.');
        res.redirect('/');
    }
});

// Route for analytics:
router.get('/analytics', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const analyticsData = await getPostAnalytics(userId);

        const labels = analyticsData.viewsOverTime.map(datapoint => datapoint.date);
        const viewsData = analyticsData.viewsOverTime.map(datapoint => datapoint.views);
        const likesData = analyticsData.likesOverTime.map(datapoint => datapoint.likes);
        const commentsData = analyticsData.commentsOverTime.map(datapoint => datapoint.comments);

        res.render('performance/analytics', {
            user: req.user,
            analytics: analyticsData,
            labels: JSON.stringify(labels),
            viewsData: JSON.stringify(viewsData),
            likesData: JSON.stringify(likesData),
            commentsData: JSON.stringify(commentsData),
        });
    } catch (error) {
        console.error("Error retrieving analytics data:", error);
        res.status(500).send("Error retrieving analytics data.");
    }
});

module.exports = router;