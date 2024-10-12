const express = require('express');
const router = express.Router();

const Notification = require('../models/notification');
const { ensureAuthenticated } = require('../middleware/auth');
const fetchNotifications = require('../middleware/notifications');

router.get('/notifications', ensureAuthenticated, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .populate('fromUser', 'username')
            .populate('post', 'title');

            const unreadCount =  notifications.filter(notification => notification.isRead === false).length
        res.render('notifications', {
            notifications,
            user: req.user,
            notificationCount: unreadCount
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.render('notifications', { notifications: [], user: req.user, notificationCount: 0 });
    }
});


// Mark as read:
router.post('/notifications/mark-read/:id', ensureAuthenticated, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.redirect('/notifications');
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.redirect('/notifications');
    }
});

// Mark all as read:
router.post('/notifications/mark-all-read', ensureAuthenticated, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        res.redirect('/notifications');
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.redirect('/notifications');
    }
});

// Count unread notifications route
router.get('/notifications/count', ensureAuthenticated, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
        res.json(count);
    } catch (error) {
        console.error("Error fetching notification count:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;