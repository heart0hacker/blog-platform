const BlogPost = require('../models/blogpost')
const getFeaturedPosts = async (req, res, next) => {
    const sortBy = req.query.sort || 'likes';  // Default to 'likes' if no sort query is provided
    let sortOptions = {};

    // Define sorting options based on the sort query
    switch (sortBy) {
        case 'views':
            sortOptions = { views: -1 };  // Sort by views in descending order
            break;
        case 'likes':
            sortOptions = { likes: -1 };  // Sort by likes in descending order
            break;
        case 'new':
            sortOptions = { createdAt: -1 };  // Sort by newest posts (createdAt descending)
            break;
        default:
            sortOptions = { likes: -1 };  // Default to likes if an invalid option is provided
            break;
    }

    try {
        // Fetch the top 5 featured posts based on the sorting option
        const featuredPosts = await BlogPost.find().sort(sortOptions).limit(5).exec();
        req.featuredPosts = featuredPosts;  // Attach the result to the request object
        next();  // Move to the next middleware or route handler
    } catch (error) {
        console.error("Error fetching featured posts:", error);
        return res.status(500).json({ error: 'Error fetching featured posts' });
    }
};

module.exports = getFeaturedPosts;