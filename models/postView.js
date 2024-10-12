const mongoose = require('mongoose');

const postViewSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogPost',
        required: true
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

const PostView = mongoose.model('PostView', postViewSchema);
module.exports = PostView;