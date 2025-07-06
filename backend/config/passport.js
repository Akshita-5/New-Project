const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      // User exists, update last login
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Check if user exists with the same email
    user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.isGoogleUser = true;
      user.isEmailVerified = true; // Google emails are verified
      user.lastLogin = new Date();
      
      // Update avatar if not set
      if (!user.avatar && profile.photos[0]) {
        user.avatar = profile.photos[0].value;
      }
      
      await user.save();
      return done(null, user);
    }

    // Create new user
    user = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar: profile.photos[0] ? profile.photos[0].value : '',
      isGoogleUser: true,
      isEmailVerified: true,
      lastLogin: new Date()
    });

    await user.save();
    done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    done(error, null);
  }
}));

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  algorithms: ['HS256']
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.id).select('-password');
    
    if (user && user.isActive) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));

module.exports = passport;