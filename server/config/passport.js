const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

module.exports = function (passport) {
  // Check if Google OAuth credentials are available
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Warning: Google OAuth credentials missing. Google authentication will not work.");
    console.warn("Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file");
    return; // Skip Google Strategy setup
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }

          // Create new user
          const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).substring(2, 8),
            email: profile.emails[0].value,
            isVerified: true, // Google emails are verified
            role: "user",
          });

          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};