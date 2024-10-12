const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Register:
router.get('/register', (req, res)=>{
    res.render('register')
});

router.post('/register', async(req, res)=>{
    const {username, email, password} = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });
        await newUser.save();
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.redirect('/register');
    }
});

// Login:
router.get('/login', (req, res)=>{
    res.render('login')
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

// Logout:
router.get('/logout', (req, res)=>{
    req.logout((err)=>{
        if(err) {
            return next(err)
        }
        res.redirect('/login');
    });
});

module.exports = router;