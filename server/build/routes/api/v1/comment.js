'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const constants_1 = require('..\\..\\..\\constants\\constants');
const utils_1 = require('..\\..\\..\\helpers\\utils');
const middlewares_1 = require('..\\..\\..\\middlewares\\index');
const schemas_1 = require('..\\..\\..\\schemas\\index');
const validations_1 = require('..\\..\\..\\validations\\validations');
const express_1 = require('express');
const mongoose_1 = require('mongoose');
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/v1/comment/:post_id', middlewares_1.isAuthenticated, (0, middlewares_1.validateObjectID)('post_id'), (0, validations_1.validateBody)(validations_1.schemas.commentSchema), async (req, res, next) => {
    try {
        const {post_id} = req.params;
        const {body} = req.body;
        const userID = req.user._id;
        // check if the POST actually exists
        const post = await schemas_1.Post.findById(post_id);
        if (!post)
            return next(new middlewares_1.ErrorHandler(404, 'Unable to comment. Post not found.'));
        const comment = new schemas_1.Comment({
            _post_id: post_id,
            _author_id: userID,
            body: utils_1.filterWords.clean(body),
            createdAt: Date.now()
        });
        await comment.save();
        await schemas_1.Post.findByIdAndUpdate(post_id, { $push: { comments: comment._id } });
        await comment.populate({
            path: 'author',
            select: 'username profilePicture fullname'
        }).execPopulate();
        // SEND NOTIFICATION
        if (post._author_id.toString() !== userID.toString()) {
            const io = req.app.get('io');
            const notification = new schemas_1.Notification({
                type: 'comment',
                initiator: userID,
                target: mongoose_1.Types.ObjectId(post._author_id),
                link: `/post/${ post_id }`,
                createdAt: Date.now()
            });
            notification.save().then(async doc => {
                await doc.populate({
                    path: 'target initiator',
                    select: 'fullname profilePicture username'
                }).execPopulate();
                io.to(post._author_id.toString()).emit('newNotification', {
                    notification: doc,
                    count: 1
                });
            });
        }
        res.status(200).send((0, utils_1.makeResponseJson)(comment));
    } catch (e) {
        console.log('CAN"T COMMENT', e);
        next(e);
    }
});
router.get('/v1/comment/:post_id', middlewares_1.isAuthenticated, (0, middlewares_1.validateObjectID)('post_id'), async (req, res, next) => {
    try {
        const {post_id} = req.params;
        const skipParams = parseInt(req.query.skip);
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || constants_1.COMMENTS_LIMIT;
        const skip = skipParams || offset * limit;
        const post = await schemas_1.Post.findById(mongoose_1.Types.ObjectId(post_id));
        if (!post)
            return next(new middlewares_1.ErrorHandler(404, 'No comments found.'));
        const comments = await schemas_1.Comment.find({ _post_id: post_id }).limit(limit).populate({
            path: 'author',
            select: 'fullname username profilePicture'
        }).skip(skip).sort({ createdAt: -1 });
        // res.status(200).send(comments)
        const commentsAgg = await schemas_1.Comment.aggregate([
            { $match: { _post_id: mongoose_1.Types.ObjectId(post_id) } },
            {
                $group: {
                    _id: '$_post_id',
                    count: { $sum: 1 }
                }
            }
        ]);
        if (commentsAgg.length === 0) {
            return next(new middlewares_1.ErrorHandler(404, 'No comments found.'));
        }
        const commentsCount = commentsAgg[0].count || 0;
        const result = {
            comments,
            commentsCount
        };
        if (commentsCount === 0 || result.comments.length === 0) {
            return next(new middlewares_1.ErrorHandler(404, 'No more comments.'));
        }
        console.log(result);
        res.status(200).send((0, utils_1.makeResponseJson)(result));
    } catch (e) {
        console.log(e);
        next(e);
    }
});
router.delete('/v1/comment/:comment_id', middlewares_1.isAuthenticated, (0, middlewares_1.validateObjectID)('comment_id'), async (req, res, next) => {
    try {
        const {comment_id} = req.params;
        const userID = req.user._id.toString();
        const comment = await schemas_1.Comment.findById(comment_id);
        if (!comment)
            return next(new middlewares_1.ErrorHandler(400, 'Comment not found.'));
        // FIND THE POST TO GET AUTHOR ID
        const post = await schemas_1.Post.findById(comment._post_id);
        const postAuthorID = post._author_id.toString();
        const commentAuthorID = comment._author_id.toString();
        // IF POST OWNER OR COMMENTOR - DELETE COMMENT
        if (userID === commentAuthorID || userID === postAuthorID) {
            await schemas_1.Comment.findByIdAndDelete(comment_id);
            await schemas_1.Post.findOneAndUpdate({ comments: { $in: [comment_id] } }, { $pull: { comments: mongoose_1.Types.ObjectId(comment_id) } });
            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
});
router.patch('/v1/comment/:comment_id', middlewares_1.isAuthenticated, (0, middlewares_1.validateObjectID)('comment_id'), (0, validations_1.validateBody)(validations_1.schemas.commentSchema), async (req, res, next) => {
    try {
        const {comment_id} = req.params;
        const {body} = req.body;
        const userID = req.user._id;
        if (!body)
            return res.sendStatus(400);
        const comment = await schemas_1.Comment.findById(comment_id);
        if (!comment)
            return next(new middlewares_1.ErrorHandler(400, 'Comment not found.'));
        if (userID.toString() === comment._author_id.toString()) {
            const updatedComment = await schemas_1.Comment.findByIdAndUpdate(mongoose_1.Types.ObjectId(comment_id), {
                $set: {
                    body: utils_1.filterWords.clean(body),
                    updatedAt: Date.now(),
                    isEdited: true
                }
            }, { new: true });
            await updatedComment.populate({
                path: 'author',
                select: 'fullname username profilePicture'
            }).execPopulate();
            res.status(200).send((0, utils_1.makeResponseJson)(updatedComment));
        } else {
            return next(new middlewares_1.ErrorHandler(401));
        }
    } catch (e) {
        next(e);
    }
});
exports.default = router;    //# sourceMappingURL=comment.js.map
