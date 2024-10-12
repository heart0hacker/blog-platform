const mongoose = require('mongoose');

const commentModelSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogPost',
        required: true
    },
    commentedAt: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

const commentModel = mongoose.model('commentModel', commentModelSchema);
module.exports = commentModel;