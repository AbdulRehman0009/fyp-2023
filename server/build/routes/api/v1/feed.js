'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const constants_1 = require('..\\..\\..\\constants\\constants');
const utils_1 = require('..\\..\\..\\helpers\\utils');
const middlewares_1 = require('..\\..\\..\\middlewares\\index');
const schemas_1 = require('..\\..\\..\\schemas\\index');
const PostSchema_1 = require('..\\..\\..\\schemas\\PostSchema');
const express_1 = require('express');
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/v1/feed', async (req, res, next) => {
    try {
        const offset = parseInt(req.query.offset, 10) || 0;
        const limit = constants_1.FEED_LIMIT;
        const skip = offset * limit;
        let result = [];
        if (req.isAuthenticated()) {
            const feeds = await schemas_1.NewsFeed.find({ follower: req.user._id }).sort({ createdAt: -1 }).populate({
                path: 'post',
                populate: {
                    path: 'author likesCount commentsCount',
                    select: 'profilePicture username fullname'
                }
            }).limit(limit).skip(skip);
            const filteredFeed = feeds.filter(feed => {
                if (feed.post) {
                    return feed.post.privacy === 'follower' || feed.post.privacy === 'public';
                }
            })    // filter out null posts (users that have been deleted but posts still in db)
.map(feed => {
                const isPostLiked = feed.post.isPostLiked(req.user._id);
                const isBookmarked = req.user.isBookmarked(feed.post.id);
                const isOwnPost = feed.post._author_id.toString() === req.user._id.toString();
                return Object.assign(Object.assign({}, feed.post.toObject()), {
                    isLiked: isPostLiked,
                    isBookmarked,
                    isOwnPost
                });
            });
            if (filteredFeed.length === 0) {
                return next(new middlewares_1.ErrorHandler(404, 'No more feed.'));
            }
            result = filteredFeed;
        } else {
            const feeds = await schemas_1.Post.find({ privacy: PostSchema_1.EPrivacy.public }).sort({ createdAt: -1 }).populate({
                path: 'author likesCount commentsCount',
                select: 'profilePicture username fullname'
            }).limit(limit).skip(skip);
            if (feeds.length === 0) {
                return next(new middlewares_1.ErrorHandler(404, 'No more feed.'));
            }
            result = feeds;
        }
        res.status(200).send((0, utils_1.makeResponseJson)(result));
    } catch (e) {
        console.log('CANT GET FEED', e);
        next(e);
    }
});
exports.default = router;    //# sourceMappingURL=feed.js.map
