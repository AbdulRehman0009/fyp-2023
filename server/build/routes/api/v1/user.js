'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const utils_1 = require('..\\..\\..\\helpers\\utils');
const middlewares_1 = require('..\\..\\..\\middlewares\\index');
const schemas_1 = require('..\\..\\..\\schemas\\index');
const cloudinary_1 = require('..\\..\\..\\storage\\cloudinary');
const validations_1 = require('..\\..\\..\\validations\\validations');
const express_1 = require('express');
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/v1/:username', middlewares_1.isAuthenticated, async (req, res, next) => {
    try {
        const reqUser = req.user;
        const {username} = req.params;
        const user = await schemas_1.User.findOne({ username });
        if (!user)
            return next(new middlewares_1.ErrorHandler(404, 'User not found.'));
        const result = await schemas_1.Follow.aggregate([
            { $match: { _user_id: user._id } },
            {
                $project: {
                    following: {
                        $ifNull: [
                            '$following',
                            []
                        ]
                    },
                    followers: {
                        $ifNull: [
                            '$followers',
                            []
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    followingCount: { $size: '$following' },
                    followersCount: { $size: '$followers' },
                    followers: 1
                }
            }
        ]);
        console.log(result);
        const {followingCount, followersCount, followers} = result[0] || {};
        const toObjectUser = Object.assign(Object.assign({}, user.toUserJSON()), {
            followingCount: followingCount || 0,
            followersCount: followersCount || 0
        });
        if (reqUser.username !== username) {
            let isFollowing = false;
            if (followers) {
                isFollowing = followers.some(follower => {
                    return follower._id.toString() === reqUser._id.toString();
                });
            }
            toObjectUser.isFollowing = isFollowing;
        }
        toObjectUser.isOwnProfile = reqUser.username === username;
        res.status(200).send((0, utils_1.makeResponseJson)(toObjectUser));
    } catch (e) {
        console.log(e);
        next(e);
    }
});
router.patch('/v1/:username/edit', middlewares_1.isAuthenticated, (0, validations_1.validateBody)(validations_1.schemas.editProfileSchema), async (req, res, next) => {
    try {
        const {username} = req.params;
        const {firstname, lastname, bio, birthday, gender} = req.body;
        const update = { info: {} };
        if (username !== req.user.username)
            return next(new middlewares_1.ErrorHandler(401));
        if (typeof firstname !== 'undefined')
            update.firstname = firstname;
        if (typeof lastname !== 'undefined')
            update.lastname = lastname;
        if (bio)
            update.info.bio = bio;
        if (birthday)
            update.info.birthday = birthday;
        if (gender)
            update.info.gender = gender;
        const newUser = await schemas_1.User.findOneAndUpdate({ username }, { $set: update }, { new: true });
        res.status(200).send((0, utils_1.makeResponseJson)(newUser.toUserJSON()));
    } catch (e) {
        console.log(e);
        next(e);
    }
});
router.post('/v1/upload/:field', middlewares_1.isAuthenticated, cloudinary_1.multer.single('photo'), async (req, res, next) => {
    try {
        const {field} = req.params;
        const file = req.file;
        if (!file)
            return next(new middlewares_1.ErrorHandler(400, 'File not provided.'));
        if (![
                'picture',
                'cover'
            ].includes(field))
            return next(new middlewares_1.ErrorHandler(400, `Unexpected field ${ field }`));
        const image = await (0, cloudinary_1.uploadImageToStorage)(file, `${ req.user.username }/profile`);
        const fieldToUpdate = field === 'picture' ? 'profilePicture' : 'coverPhoto';
        await schemas_1.User.findByIdAndUpdate(req.user._id, { $set: { [fieldToUpdate]: image } });
        res.status(200).send((0, utils_1.makeResponseJson)(image));
    } catch (e) {
        console.log('CANT UPLOAD FILE: ', e);
        next(e);
    }
});
exports.default = router;    //# sourceMappingURL=user.js.map
