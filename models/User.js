const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'
    },
    profilePicture: {
        type: String
    },
    bio: {
        type: String
    },
    socialLinks: {
        facebook: {
            type: String
        },
        twitter: {
            type: String
        },
        instagram: {
            type: String
        },
        linkedin: {
            type: String
        },
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // IDs of users following this user
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // IDs of users this user follows
    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogPost'
    }],
}, {timestamps: true});

const User = mongoose.model('User', userSchema);
module.exports = User;