// middleware/notifications.js
const Notification = require('../models/notification');

const fetchNotifications = async (req, res, next) => {
    if (req.user) { // Ensure the user is logged in
        try {
            const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
            res.locals.notifications = notifications; // Store all notifications
            res.locals.notificationCount = notifications.filter(notification => !notification.isRead).length; // Count unread notifications
        } catch (error) {
            console.error("Error fetching notifications:", error);
            res.locals.notifications = [];
            res.locals.notificationCount = 0;
        }
    } else {
        res.locals.notifications = [];
        res.locals.notificationCount = 0;
    }
    next();
};

module.exports = fetchNotifications;