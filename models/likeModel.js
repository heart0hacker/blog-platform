const mongoose = require('mongoose');

const likeModelSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogPost',
        required: true
    },
    likedAt: {
        type: Date,
        default: Date.now
    },
}, {timestamps: true});

const likeModel = mongoose.model('likeModel', likeModelSchema);
module.exports = likeModel;