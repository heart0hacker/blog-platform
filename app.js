const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const User = require('./models/User');
const profileRoutes = require('./routes/profile');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const fetchNotifications = require('./middleware/notifications');

// For protection:
const helmet = require('helmet');
const csrf = require('csrf');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB with options for better error handling
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));
mongoose.set('strictPopulate', false);
mongoose.set('strictQuery', true);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(express.static('public', {
    maxAge: '1d' // Cache files for 1 day
}));
app.use((req, res, next) => {
    res.locals.currentRoute = req.path,
    next()
});
app.use(fetchNotifications);
// app.use(helmet());
// app.use(csrf()); 

app.use(session({
    secret: process.env.SESSION_SECRET || 'yourSuperStrongRandomString',
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 24 * 60 * 60 * 1000}
}));

// Passport configuration
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return done(null, false, { message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Invalid password' });
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Middleware to pass user data to all views
app.use((req, res, next) => {
    res.locals.user = req.user || null; // Make user available in all views
    res.locals.error_msg = req.flash('error_msg'); // Flash messages
    res.locals.success_msg = req.flash('success_msg'); // Flash messages
    next();
});

// View engine
app.set('view engine', 'ejs');

// Define routes
app.use(methodOverride('_method'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/blog'));
app.use('/', require('./routes/dashboard'));
app.use('/', require('./routes/follow'));
app.use('/', require('./routes/search'));
app.use('/', require('./routes/comment'));
app.use('/', require('./routes/like'));
app.use('/', require('./routes/notification'));
app.use('/', profileRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware 
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (process.env.NODE_ENV === 'production') {
        console.error('error');
        res.render('error/errorPage')
    } else {
        res.status(500).send('Something broke!');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`App running at http://localhost:${PORT}/`);
});