const express = require('express');
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');  // Middleware to protect routes

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname).toLowerCase());
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 2 }, //limi 2mb;
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/; 
        const mimetype = filetypes.test(file.mimetype.toLowerCase());
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            console.log(`Rejected file - MIME type: ${file.mimetype}, extension: ${path.extname(file.originalname)}`);
            cb(new Error('Only images (jpg, jpeg, png) are allowed'))
        }
    }
});

// Route to get user Profile
router.get('/profile/edit', ensureAuthenticated, async (req, res) => {
    res.render('editProfile', { user: req.user });
});

// Route to edit user profile
router.post('/profile/edit', ensureAuthenticated, async (req, res) => {
    try {
        const { bio, facebook, twitter, instagram, linkedin } = req.body;
        await User.findByIdAndUpdate(req.user._id, { bio, socialLinks:{ facebook, twitter, instagram, linkedin} });

        req.flash('success_msg', 'Profile updated successfully.');
        res.redirect('/profile/edit');
    } catch (error) {
        req.flash('error_msg', 'Error updating profile.');
        res.redirect('/profile/edit');
    }
});

// Route to upload profile picture
router.post('/profile/upload', ensureAuthenticated, upload.single('profilePicture'), async (req, res) => {
    try {
        // Check if the file was uploaded
        if (!req.file) {
            req.flash('error_msg', 'Please upload a valid image file.');
            return res.redirect('/profile/edit');
        }

        const profilePicture = `uploads/${req.file.filename}`;
        
        // Update the user's profile picture
        const user = await User.findById(req.user._id);
        if (user.profilePicture) {
            fs.unlinkSync(path.join(__dirname, '../', user.profilePicture)); // Delete old picture
        }
        
        await User.findByIdAndUpdate(req.user._id, {profilePicture})
        req.flash('success_msg', 'Profile picture updated successfully!');
        res.redirect('/profile/edit');
    } catch (error) {
        console.error('Error during profile picture upload:', error);
        req.flash('error_msg', 'Error updating profile picture.');
        res.redirect('/profile/edit');
    }
});

// Route to view profile:
router.get('/profile/:id', ensureAuthenticated, async(req, res)=>{
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/');
        }
        res.render('profile', {user, currentUser: req.user})
    } catch (error) {
        req.flash('error_msg', 'Error loading profile.');
        res.redirect('/');
    }
});

// Route for bookmarks view:
router.get('/bookmarks', ensureAuthenticated, async(req, res)=>{
    try {
        const user = await User.findById(req.user._id).populate('bookmarks');
        res.render('profile/bookmarks', {user, bookmarks: user.bookmarks});
    } catch (error) {
        console.error("Error loading bookmarks: ", error.message);
        res.status(500).json({success: false, message: 'Server Error'})
    }
});

module.exports = router;