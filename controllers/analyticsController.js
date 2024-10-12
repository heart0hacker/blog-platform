const BlogPost = require('../models/blogpost');
const commentModel = require('../models/commentModel');
const likeModel = require('../models/likeModel');
const PostView = require('../models/postView');

const getPostAnalytics = async (userId) => {
    try {
        const posts = await BlogPost.find({ author: userId });
        
        const totalPosts = posts.length;
        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalShares = 0;
        
        const viewsOverTime = [];
        const likesOverTime = []; // For likes
        const commentsOverTime = []; // For comments
        
        const viewsByDate = {};
        const likesByDate = {};
        const commentsByDate = {}; 

        // Iterate through each post
        for (const post of posts) {
            totalViews += post.views || 0;
            totalLikes += post.likes || 0;
            totalComments += post.commentsCount || 0;
            totalShares += post.shares || 0;

            const postViews = await PostView.find({ postId: post._id });

            postViews.forEach(view => {
                const date = view.viewedAt.toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                viewsByDate[date] = (viewsByDate[date] || 0) + 1; // Increment views for that date
            });

            // Assuming you have similar models/structure for likes and comments
            const postLikes = await likeModel.find({ postId: post._id }); // Adjust according to your structure
            postLikes.forEach(like => {
                const date = like.likedAt.toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                likesByDate[date] = (likesByDate[date] || 0) + 1; // Increment likes for that date
            });

            const postComments = await commentModel.find({ postId: post._id }); // Adjust according to your structure
            postComments.forEach(comment => {
                const date = comment.commentedAt.toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                commentsByDate[date] = (commentsByDate[date] || 0) + 1; // Increment comments for that date
            });
        }

        for (const date in viewsByDate) {
            viewsOverTime.push({ date, views: viewsByDate[date] });
            likesOverTime.push({ date, likes: likesByDate[date] || 0 });
            commentsOverTime.push({ date, comments: commentsByDate[date] || 0 });
        }

        return {
            totalPosts,
            totalViews,
            totalLikes,
            totalComments,
            totalShares,
            viewsOverTime,
            likesOverTime,
            commentsOverTime
        };
    } catch (error) {
        console.error("Error fetching post analytics:", error);
        throw error;
    }
}

module.exports = { getPostAnalytics };