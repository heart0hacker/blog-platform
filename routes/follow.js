const express = require('express');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');
const BlogPost = require('../models/blogpost');
const Notification = require('../models/notification');
const router = express.Router();

// Follow a user
router.post('/follow/:userId', ensureAuthenticated, async (req, res) => {
   try {
     const userIdToFollow = req.params.userId;
     const currentUserId = req.user._id;

     await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: userIdToFollow } });
     await User.findByIdAndUpdate(userIdToFollow, { $addToSet: { followers: currentUserId } });

     const newNotification = new Notification({
       user: userIdToFollow,
      type: 'follow',
      post: null,
      fromUser: currentUserId
    });
    
    await newNotification.save();
    
    res.redirect('/profile/' + userIdToFollow);
   } catch (error) {
     console.error(error);
     res.status(500).send("Error occurred while following user.");
   }
});

// Unfollow a user
router.post('/unfollow/:userId', ensureAuthenticated, async (req, res) => {
   try {
     const userIdToUnfollow = req.params.userId;
     const currentUserId = req.user._id;

     await User.findByIdAndUpdate(currentUserId, { $pull: { following: userIdToUnfollow } });
     await User.findByIdAndUpdate(userIdToUnfollow, { $pull: { followers: currentUserId } });

     res.redirect('/profile/' + userIdToUnfollow);
   } catch (error) {
     console.error(error);
     res.status(500).send("Error occurred while unfollowing user.");
   }
});

// Feed - show posts from followed users:
router.get('/feed', ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user;
      const followingUsers = currentUser.following;
 
      // Fetch posts by followed users
      const posts = await BlogPost.find({ author: { $in: followingUsers } }).populate('author');
      
      // Pass currentUser to the template
      res.render('feed', { posts, currentUser });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error occurred while fetching feed.");
    }
 });
 
module.exports = router;