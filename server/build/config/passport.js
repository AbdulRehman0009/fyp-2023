'use strict';
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
const UserSchema_1 = __importDefault(require('..\\schemas\\UserSchema'));
const passport_facebook_1 = __importDefault(require('passport-facebook'));
const passport_google_oauth2_1 = __importDefault(require('passport-google-oauth2'));
const passport_local_1 = __importDefault(require('passport-local'));
function default_1(passport) {
    passport.serializeUser(function (user, done) {
        done(null, user._id);
        console.log('SERIALIZE', user);
    });
    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        UserSchema_1.default.findById(id, function (err, user) {
            if (err) {
                console.log('ERR', err);
                return done(err);
            }
            done(err, user);
        });
    });
    passport.use('local-register', new passport_local_1.default.Strategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, (req, email, password, done) => {
        UserSchema_1.default.findOne({ email }).then(user => {
            if (user) {
                return done(null, false, { message: 'Email already has been already used by other user.' });
            } else {
                const newUser = new UserSchema_1.default({
                    email,
                    password,
                    username: req.body.username
                });
                newUser.save(function (err) {
                    if (err) {
                        return done(err);
                    }
                    return done(null, newUser);
                });
            }
        }).catch(e => {
            return done(e);
        });
    }));
    passport.use('local-login', new passport_local_1.default.Strategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    }, async (req, username, password, done) => {
        try {
            const user = await UserSchema_1.default.findOne({ username });
            if (user) {
                user.passwordMatch(password, function (err, match) {
                    if (err) {
                        return done(err);
                    }
                    if (match) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Incorrect credentials.' });
                    }
                });
            } else {
                return done(null, false, { message: 'Incorrect credentials.' });
            }
        } catch (err) {
            return done(err);
        }
    }));
    passport.use('facebook-auth', new passport_facebook_1.default.Strategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: `/api/v1/auth/facebook/callback`,
        profileFields: [
            'id',
            'profileUrl',
            'email',
            'displayName',
            'name',
            'gender',
            'picture.type(large)'
        ]
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const fbProfile = profile._json;
            const user = await UserSchema_1.default.findOne({ provider_id: fbProfile.id });
            if (user) {
                return done(null, user);
            } else {
                const randomString = Math.random().toString(36).substring(2);
                const newUser = new UserSchema_1.default({
                    username: fbProfile.email.split('@')[0],
                    email: fbProfile.email,
                    password: randomString,
                    firstname: fbProfile.first_name,
                    lastname: fbProfile.last_name,
                    profilePicture: { url: fbProfile.picture ? fbProfile.picture.data.url : '' },
                    provider_id: fbProfile.id,
                    provider: 'facebook',
                    provider_access_token: accessToken,
                    provider_refresh_token: refreshToken
                });
                newUser.save(function (err) {
                    if (err) {
                        done(null, false, err);    // handle errors!
                    } else {
                        console.log('SUCCESSFULL CREATED', newUser);
                        done(null, newUser);
                    }
                });
            }
        } catch (err) {
            console.log(err);
            return done(err);
        }
    }));
    // passport.use(
    //   "github-auth",
    //   new GitHubStrategy.Strategy(
    //     {
    //       clientID: process.env.GITHUB_CLIENT_ID,
    //       clientSecret: process.env.GITHUB_CLIENT_SECRET,
    //       callbackURL: `/api/v1/auth/github/callback`,
    //       scope: "user:email",
    //     },
    //     async (accessToken, refreshToken, profile, done) => {
    //       try {
    //         const githubProfile: any = profile._json;
    //         const user = await User.findOne({ provider_id: githubProfile.id });
    //         if (user) {
    //           return done(null, user);
    //         } else {
    //           const randomString = Math.random().toString(36).substring(2);
    //           const newUser = new User({
    //             username: githubProfile.login,
    //             email: githubProfile.email,
    //             password: randomString,
    //             firstname: githubProfile.name.split(" ")[0],
    //             lastname: githubProfile.name.split(" ")[1],
    //             profilePicture: {
    //               url: githubProfile.avatar_url,
    //             },
    //             provider_id: githubProfile.id,
    //             provider: "github",
    //             "info.bio": githubProfile.bio,
    //             provider_access_token: accessToken,
    //             provider_refresh_token: refreshToken,
    //           });
    //           newUser.save(function (err) {
    //             if (err) {
    //               console.log(err);
    //               done(null, false, err); // handle errors!
    //             } else {
    //               console.log("SUCCESSFULL CREATED", newUser);
    //               done(null, newUser);
    //             }
    //           });
    //         }
    //       } catch (err) {
    //         console.log(err);
    //         return done(err);
    //       }
    //     }
    //   )
    // );
    passport.use('google-auth', new passport_google_oauth2_1.default.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `/api/v1/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log(profile);
            const user = await UserSchema_1.default.findOne({ provider_id: profile.id });
            console.log(profile);
            if (user) {
                return done(null, user);
            } else {
                const randomString = Math.random().toString(36).substring(2);
                const randomNumber = Math.floor(Math.random() * 100);
                const photo = profile.picture ? { url: profile.picture } : {};
                const newUser = new UserSchema_1.default({
                    username: `${ profile.given_name }_${ profile.family_name }${ randomNumber }`,
                    email: profile.email,
                    password: randomString,
                    firstname: profile.given_name,
                    lastname: profile.family_name,
                    profilePicture: photo,
                    provider_id: profile.id,
                    provider: 'google',
                    provider_access_token: accessToken,
                    provider_refresh_token: refreshToken
                });
                newUser.save(function (err) {
                    if (err) {
                        done(null, false, err);
                    } else {
                        console.log('SUCCESSFULL CREATED', newUser);
                        done(null, newUser);
                    }
                });
            }
        } catch (err) {
            console.log(err);
            return done(err);
        }
    }));
}
exports.default = default_1;    //# sourceMappingURL=passport.js.map
