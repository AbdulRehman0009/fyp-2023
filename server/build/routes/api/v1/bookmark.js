'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const constants_1 = require('..\\..\\..\\constants\\constants');
const utils_1 = require('..\\..\\..\\helpers\\utils');
const error_middleware_1 = require('..\\..\\..\\middlewares\\error.middleware');
const middlewares_1 = require('..\\..\\..\\middlewares\\middlewares');
const schemas_1 = require('..\\..\\..\\schemas\\index');
const express_1 = require('express');
const mongoose_1 = require('mongoose');
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/v1/bookmark/post/:post_id', middlewares_1.isAuthenticated, (0, middlewares_1.validateObjectID)('post_id'), async (req, res, next) => {
    try {
        const {post_id} = req.params;
        const userID = req.user._id;
        const post = await schemas_1.Post.findById(post_id);
        if (!post)
            return res.sendStatus(404);
        if (userID.toString() === post._author_id.toString()) {
            return next(new error_middleware_1.ErrorHandler(400, 'You can\'t bookmark your own post.'));
        }
        const isPostBookmarked = await schemas_1.Bookmark.findOne({
            _author_id: userID,
            _post_id: mongoose_1.Types.ObjectId(post_id)
        });
        if (isPostBookmarked) {
            await schemas_1.Bookmark.findOneAndDelete({
                _author_id: userID,
                _post_id: mongoose_1.Types.ObjectId(post_id)
            });
            await schemas_1.User.findByIdAndUpdate(userID, { $pull: { bookmarks: mongoose_1.Types.ObjectId(post_id) } });
            res.status(200).send((0, utils_1.makeResponseJson)({ state: false }));
        } else {
            const bookmark = new schemas_1.Bookmark({
                _post_id: post_id,
                _author_id: userID,
                createdAt: Date.now()
            });
            await bookmark.save();
            await schemas_1.User.findByIdAndUpdate(userID, { $push: { bookmarks: post_id } });
            res.status(200).send((0, utils_1.makeResponseJson)({ state: true }));
        }
    } catch (e) {
        console.log('CANT BOOKMARK POST ', e);
        next(e);
    }
});
router.get('/v1/bookmarks', middlewares_1.isAuthenticated, async (req, res, next) => {
    try {
        const userID = req.user._id;
        const offset = parseInt(req.query.offset, 10) || 0;
        const limit = constants_1.BOOKMARKS_LIMIT;
        const skip = offset * limit;
        // GET TOTAL
        const countBookmarks = await schemas_1.Bookmark.find({ _author_id: userID });
        const bookmarks = await schemas_1.Bookmark.find({ _author_id: userID }).populate({
            path: 'post',
            select: 'photos description',
            populate: { path: 'likesCount commentsCount' }
        }).limit(limit).skip(skip).sort({ createdAt: -1 });
        if (bookmarks.length === 0) {
            return next(new error_middleware_1.ErrorHandler(404, 'You don\'t have any bookmarks.'));
        }
        const result = bookmarks.map(item => {
            const isBookmarked = req.user.isBookmarked(item._post_id);
            return Object.assign(Object.assign({}, item.toObject()), { isBookmarked });
        });
        res.status(200).send((0, utils_1.makeResponseJson)({
            bookmarks: result,
            total: countBookmarks.length
        }));
    } catch (e) {
        console.log('CANT GET BOOKMARKS ', e);
        next(e);
    }
});
exports.default = router;    //# sourceMappingURL=bookmark.js.map
