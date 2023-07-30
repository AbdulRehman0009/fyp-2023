'use strict';
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
//@ts-ignore
const utils_1 = require('..\\..\\..\\helpers\\utils');
const error_middleware_1 = require('..\\..\\..\\middlewares\\error.middleware');
const validations_1 = require('..\\..\\..\\validations\\validations');
const express_1 = require('express');
const passport_1 = __importDefault(require('passport'));
const router = (0, express_1.Router)({ mergeParams: true });
//@route POST /api/v1/register
router.post('/v1/register', (0, validations_1.validateBody)(validations_1.schemas.registerSchema), (req, res, next) => {
    passport_1.default.authenticate('local-register', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (user) {
            // if user has been successfully created
            req.logIn(user, function (err) {
                // <-- Log user in
                if (err) {
                    return next(err);
                }
                const userData = (0, utils_1.sessionizeUser)(user);
                return res.status(200).send((0, utils_1.makeResponseJson)(userData));
            });
        } else {
            next(new error_middleware_1.ErrorHandler(409, info.message));
        }
    })(req, res, next);
});
//@route POST /api/v1/authenticate
router.post('/v1/authenticate', (0, validations_1.validateBody)(validations_1.schemas.loginSchema), (req, res, next) => {
    console.log('FIREED');
    passport_1.default.authenticate('local-login', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next(new error_middleware_1.ErrorHandler(400, info.message));
        } else {
            req.logIn(user, function (err) {
                // <-- Log user in
                if (err) {
                    return next(err);
                }
                const userData = (0, utils_1.sessionizeUser)(user);
                return res.status(200).send((0, utils_1.makeResponseJson)({
                    auth: userData,
                    user: req.user.toUserJSON()
                }));
            });
        }
    })(req, res, next);
});
//@route GET /api/v1/auth/facebook FACEBOOK AUTH
router.get('/v1/auth/facebook', passport_1.default.authenticate('facebook-auth', {
    scope: [
        'email',
        'public_profile'
    ]
}));
//@route GET /api/v1/auth/facebook/callback FACEBOOK AUTH CALLBACK
router.get('/v1/auth/facebook/callback', passport_1.default.authenticate('facebook-auth', {
    failureRedirect: `${ process.env.CLIENT_URL }/auth/facebook/failed`,
    successRedirect: `${ process.env.CLIENT_URL }`
}));
////@route GET /api/v1/auth/github GITHUB AUTH
//router.get("/v1/auth/github", passport.authenticate("github-auth"));
////@route GET /api/v1/auth/github/callback GITHUB AUTH
//router.get(
//  "/v1/auth/github/callback",
//  passport.authenticate("github-auth", {
//    failureRedirect: `${process.env.CLIENT_URL}/auth/github/failed`,
//    successRedirect: `${process.env.CLIENT_URL}`,
//  })
//);
//@route GET /api/v1/auth/github GITHUB AUTH
router.get('/v1/auth/google', passport_1.default.authenticate('google-auth', {
    scope: [
        'email',
        'profile'
    ]
}));
//@route GET /api/v1/auth/github/callback GITHUB AUTH
router.get('/v1/auth/google/callback', passport_1.default.authenticate('google-auth', {
    failureRedirect: `${ process.env.CLIENT_URL }/auth/google/failed`,
    successRedirect: `${ process.env.CLIENT_URL }`
}));
//@route DELETE /api/v1/logout
router.delete('/v1/logout', (req, res) => {
    try {
        req.logOut(error => {
            console.log(error);
        });
        res.sendStatus(200);
    } catch (e) {
        res.status(422).send((0, utils_1.makeResponseJson)({
            status_code: 422,
            message: 'Unable to logout. Please try again.'
        }));
    }
});
//@route GET /api/v1/checkSession
// Check if user session exists
router.get('/v1/check-session', (req, res, next) => {
    if (req.isAuthenticated()) {
        const user = (0, utils_1.sessionizeUser)(req.user);
        res.status(200).send((0, utils_1.makeResponseJson)({
            auth: user,
            user: req.user.toUserJSON()
        }));
    } else {
        next(new error_middleware_1.ErrorHandler(404, 'Session invalid/expired.'));
    }
});
exports.default = router;    //# sourceMappingURL=auth.js.map
