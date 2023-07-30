'use strict';
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
const utils_1 = require('..\\..\\..\\helpers\\utils');
const middlewares_1 = require('..\\..\\..\\middlewares\\index');
const schemas_1 = require('..\\..\\..\\schemas\\index');
const PostSchema_1 = require('..\\..\\..\\schemas\\PostSchema');
const express_1 = require('express');
const lodash_omit_1 = __importDefault(require('lodash.omit'));
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/v1/search', async (req, res, next) => {
    try {
        const {q, type} = req.query;
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const skip = offset * limit;
        if (!q)
            return next(new middlewares_1.ErrorHandler(400, 'Search query is required.'));
        let result = [];
        if (type === 'posts') {
            const posts = await schemas_1.Post.find({
                description: {
                    $regex: q,
                    $options: 'i'
                },
                privacy: PostSchema_1.EPrivacy.public
            }).populate('likesCount commentsCount').populate('author', 'profilePicture fullname username').limit(limit).skip(skip);
            if (posts.length === 0) {
                return next(new middlewares_1.ErrorHandler(404, 'No posts found.'));
            }
            const postsMerged = posts.map(post => {
                const isPostLiked = post.isPostLiked(req.user._id);
                const isBookmarked = req.user.isBookmarked(post.id);
                return Object.assign(Object.assign({}, post.toObject()), {
                    isLiked: isPostLiked,
                    isBookmarked
                });
            });
            result = postsMerged;    // console.log(posts);
        } else {
            let following = [];
            const users = await schemas_1.User.find({
                $or: [
                    {
                        firstname: {
                            $regex: q,
                            $options: 'i'
                        }
                    },
                    {
                        lastname: {
                            $regex: q,
                            $options: 'i'
                        }
                    },
                    {
                        username: {
                            $regex: q,
                            $options: 'i'
                        }
                    }
                ]
            }).limit(limit).skip(skip);
            if (users.length === 0) {
                return next(new middlewares_1.ErrorHandler(404, 'No users found.'));
            }
            if (req.isAuthenticated()) {
                const myFollowing = await schemas_1.Follow.findOne({ _user_id: req.user._id });
                following = !myFollowing ? [] : myFollowing.following;
                const usersMerged = users.map(user => {
                    return Object.assign(Object.assign({}, (0, lodash_omit_1.default)(user.toUserJSON(), 'bookmarks')), { isFollowing: following.includes(user.id) });
                });
                result = usersMerged;
            } else {
                result = users;
            }
        }
        res.status(200).send((0, utils_1.makeResponseJson)(result));
    } catch (e) {
        console.log('CANT PERFORM SEARCH: ', e);
        next(e);
    }
});
exports.default = router;    //# sourceMappingURL=search.js.map
