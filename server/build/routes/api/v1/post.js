'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const constants_1 = require('..\\..\\..\\constants\\constants');
const utils_1 = require('..\\..\\..\\helpers\\utils');
const middlewares_1 = require('..\\..\\..\\middlewares\\index');
const schemas_1 = require('..\\..\\..\\schemas\\index');
const NotificationSchema_1 = require('..\\..\\..\\schemas\\NotificationSchema');
const PostSchema_1 = require('..\\..\\..\\schemas\\PostSchema');
const cloudinary_1 = require('..\\..\\..\\storage\\cloudinary');
const validations_1 = require('..\\..\\..\\validations\\validations');
const express_1 = require('express');
const mongoose_1 = require('mongoose');
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/v1/post', middlewares_1.isAuthenticated, cloudinary_1.multer.array('photos', 5), (0, validations_1.validateBody)(validations_1.schemas.createPostSchema), async (req, res, next) => {
    try {
        const {description, privacy} = req.body;
        let photos = [];
        if (req.files) {
            const photosToSave = req.files.map(file => (0, cloudinary_1.uploadImageToStorage)(file, `${ req.user.username }/posts`));
            photos = await Promise.all(photosToSave);
            console.log(photos);
        }
        const post = new schemas_1.Post({
            _author_id: req.user._id,
            // author: req.user._id,
            description: utils_1.filterWords.clean(description),
            photos,
            privacy: privacy || 'public',
            createdAt: Date.now()
        });
        await post.save();
        await post.populate({
            path: 'author',
            select: 'profilePicture username fullname'
        }).execPopulate();
        const myFollowers = await schemas_1.Follow.findOne({ _user_id: req.user._id });
        const followers = !myFollowers ? [] : myFollowers.followers;
        let newsFeeds = [];
        // add post to follower's newsfeed
        if (myFollowers && myFollowers.followers) {
            newsFeeds = myFollowers.followers.map(follower => ({
                follower: mongoose_1.Types.ObjectId(follower._id),
                post: mongoose_1.Types.ObjectId(post._id),
                post_owner: req.user._id,
                createdAt: post.createdAt
            }));
        }
        // append own post on newsfeed
        newsFeeds = newsFeeds.concat({
            follower: req.user._id,
            post_owner: req.user._id,
            post: mongoose_1.Types.ObjectId(post._id),
            createdAt: post.createdAt
        });
        if (newsFeeds.length !== 0) {
            await schemas_1.NewsFeed.insertMany(newsFeeds);
        }
        // Notify followers that new post has been made
        const io = req.app.get('io');
        followers.forEach(user => {
            io.to(user._id.toString()).emit('newFeed', Object.assign(Object.assign({}, post.toObject()), { isOwnPost: false }));
        });
        return res.status(200).send((0, utils_1.makeResponseJson)(Object.assign(Object.assign({}, post.toObject()), { isOwnPost: true })));
    } catch (e) {
        console.log(e);
        next(e);
    }
});
router.get('/v1/:username/posts', middlewares_1.isAuthenticated, async (req, res, next) => {
    try {
        const {username} = req.params;
        const {sortBy, sortOrder} = req.query;
        const offset = parseInt(req.query.offset) || 0;
        const user = await schemas_1.User.findOne({ username });
        const myFollowing = await schemas_1.Follow.findOne({ _user_id: req.user._id });
        const following = myFollowing && myFollowing.following ? myFollowing.following : [];
        if (!user)
            return res.sendStatus(404);
        const limit = constants_1.POST_LIMIT;
        const skip = offset * limit;
        const query = {
            _author_id: user._id,
            privacy: { $in: [PostSchema_1.EPrivacy.public] }
        };
        const sortQuery = { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 };
        if (username === req.user.username) {
            query.privacy.$in = [
                PostSchema_1.EPrivacy.public,
                PostSchema_1.EPrivacy.follower,
                PostSchema_1.EPrivacy.private
            ];
        } else if (following.includes(user._id.toString())) {
            query.privacy.$in = [
                PostSchema_1.EPrivacy.public,
                PostSchema_1.EPrivacy.follower
            ];
        }
        const posts = await schemas_1.Post.find(query).sort(sortQuery).populate('commentsCount').populate('likesCount').populate({
            path: 'author',
            select: 'username fullname profilePicture'
        }).skip(skip).limit(limit);
        if (posts.length <= 0 && offset === 0) {
            return next(new middlewares_1.ErrorHandler(404, `${ username } hasn't posted anything yet.`));
        } else if (posts.length <= 0 && offset >= 1) {
            return next(new middlewares_1.ErrorHandler(404, 'No more posts.'));
        }
        const uPosts = posts.map(post => {
            // POST WITH isLiked merged
            const isPostLiked = post.isPostLiked(req.user._id);
            const isBookmarked = req.user.isBookmarked(post._id);
            const isOwnPost = post._author_id.toString() === req.user._id.toString();
            return Object.assign(Object.assign({}, post.toObject()), {
                isBookmarked,
                isOwnPost,
                isLiked: isPostLiked
            });
        });
        res.status(200).send((0, utils_1.makeResponseJson)(uPosts));
    } catch (e) {
        console.log(e);
        next(e);
    }
});
router.post('/v1/like/post/:post_id', middlewares_1.isAuthenticated, (0, middlewares_1.validateObjectID)('post_id'), async (req, res, next) => {
    try {
        const {post_id} = req.params;
        const post = await schemas_1.Post.findById(post_id);
        if (!post)
            return next(new middlewares_1.ErrorHandler(400, 'Post not found.'));
        const isPostLiked = post.isPostLiked(req.user._id);
        let query = {};
        if (isPostLiked) {
            query = { $pull: { likes: req.user._id } };
        } else {
            query = { $push: { likes: req.user._id } };
        }
        const fetchedPost = await schemas_1.Post.findByIdAndUpdate(post_id, query, { new: true });
        await fetchedPost.populate('likesCount commentsCount').execPopulate();
        await fetchedPost.populate({
            path: 'author',
            select: 'fullname username profilePicture'
        }).execPopulate();
        const result = Object.assign(Object.assign({}, fetchedPost.toObject()), { isLiked: !isPostLiked });
        if (!isPostLiked && result.author.id !== req.user._id.toString()) {
            const io = req.app.get('io');
            const targetUserID = mongoose_1.Types.ObjectId(result.author.id);
            const newNotif = {
                type: NotificationSchema_1.ENotificationType.like,
                initiator: req.user._id,
                target: targetUserID,
                link: `/post/${ post_id }`
            };
            const notificationExists = await schemas_1.Notification.findOne(newNotif);
            if (!notificationExists) {
                const notification = new schemas_1.Notification(Object.assign(Object.assign({}, newNotif), { createdAt: Date.now() }));
                const doc = await notification.save();
                await doc.populate({
                    path: 'target initiator',
                    select: 'fullname profilePicture username'
                }).execPopulate();
                io.to(targetUserID).emit('newNotification', {
                    notification: doc,
                    count: 1
                });
            } else {
                await schemas_1.Notification.findOneAndUpdate(newNotif, { $set: { createdAt: Date.now() } });
            }
        }
        res.status(200).send((0, utils_1.makeResponseJson)({
            post: result,
            state: isPostLiked
        }));
    } catch (e) {
        console.log(e);
        next(e);
    }
});
router.patch('/v1/post/:post_id', middlewares_1.isAuthenticated, (0, middlewares_1.validateObjectID)('post_id'), (0, validations_1.validateBody)(validations_1.schemas.createPostSchema), async (req, res, next) => {
    try {
        const {post_id} = req.params;
        const {description, privacy} = req.body;
        const obj = {
            updatedAt: Date.now(),
            isEdited: true
        };
        if (!description && !privacy)
            return next(new middlewares_1.ErrorHandler(400));
        if (description)
            obj.description = utils_1.filterWords.clean(description.trim());
        if (privacy)
            obj.privacy = privacy;
        const post = await schemas_1.Post.findById(post_id);
        if (!post)
            return next(new middlewares_1.ErrorHandler(400));
        if (req.user._id.toString() === post._author_id.toString()) {
            const updatedPost = await schemas_1.Post.findByIdAndUpdate(post_id, { $set: obj }, { new: true });
            await updatedPost.populate({
                path: 'author',
                select: 'fullname username profilePicture'
            }).execPopulate();
            res.status(200).send((0, utils_1.makeResponseJson)(Object.assign(Object.assign({}, updatedPost.toObject()), { isOwnPost: true })));
        } else {
            return next(new middlewares_1.ErrorHandler(401));
        }
    } catch (e) {
        console.log('CANT EDIT POST :', e);
        next(e);
    }
});
// @route /post/:post_id -- DELETE POST
router.delete('/v1/post/:post_id', middlewares_1.isAuthenticated, (0, middlewares_1.validateObjectID)('post_id'), async (req, res, next) => {
    try {
        const {post_id} = req.params;
        const post = await schemas_1.Post.findById(post_id);
        if (!post)
            return next(new middlewares_1.ErrorHandler(400));
        if (req.user._id.toString() === post._author_id.toString()) {
            const imageIDs = post.photos.filter(img => img === null || img === void 0 ? void 0 : img.public_id).map(img => img.public_id);
            if (post.photos && post.photos.length !== 0)
                await (0, cloudinary_1.deleteImageFromStorage)(imageIDs);
            await schemas_1.Post.findByIdAndDelete(post_id);
            await schemas_1.Comment.deleteMany({ _post_id: mongoose_1.Types.ObjectId(post_id) });
            await schemas_1.NewsFeed.deleteMany({ post: mongoose_1.Types.ObjectId(post_id) });
            await schemas_1.Bookmark.deleteMany({ _post_id: mongoose_1.Types.ObjectId(post_id) });
            await schemas_1.User.updateMany({ bookmarks: { $in: [post_id] } }, { $pull: { bookmarks: mongoose_1.Types.ObjectId(post_id) } });
            res.sendStatus(200);
        } else {
            return next(new middlewares_1.ErrorHandler(401));
        }
    } catch (e) {
        console.log('CANT DELETE POST', e);
        next(e);
    }
});
router.get('/v1/post/:post_id', middlewares_1.isAuthenticated, (0, middlewares_1.validateObjectID)('post_id'), async (req, res, next) => {
    try {
        const {post_id} = req.params;
        const post = await schemas_1.Post.findById(post_id);
        if (!post)
            return next(new middlewares_1.ErrorHandler(400, 'Post not found.'));
        if (post.privacy === 'private' && post._author_id.toString() !== req.user._id.toString()) {
            return next(new middlewares_1.ErrorHandler(401));
        }
        await post.populate({
            path: 'author likesCount commentsCount',
            select: 'fullname username profilePicture'
        }).execPopulate();
        const isBookmarked = req.user.isBookmarked(post_id);
        const isPostLiked = post.isPostLiked(req.user._id);
        const isOwnPost = post._author_id.toString() === req.user._id.toString();
        const result = Object.assign(Object.assign({}, post.toObject()), {
            isLiked: isPostLiked,
            isBookmarked,
            isOwnPost
        });
        res.status(200).send((0, utils_1.makeResponseJson)(result));
    } catch (e) {
        console.log('CANT GET POST', e);
        next(e);
    }
});
router.get('/v1/post/likes/:post_id', middlewares_1.isAuthenticated, (0, middlewares_1.validateObjectID)('post_id'), async (req, res, next) => {
    try {
        const {post_id} = req.params;
        const offset = parseInt(req.query.offset) || 0;
        const limit = constants_1.LIKES_LIMIT;
        const skip = offset * limit;
        const exist = await schemas_1.Post.findById(mongoose_1.Types.ObjectId(post_id));
        if (!exist)
            return next(new middlewares_1.ErrorHandler(400, 'Post not found.'));
        const post = await schemas_1.Post.findById(mongoose_1.Types.ObjectId(post_id)).populate({
            path: 'likes',
            select: 'profilePicture username fullname',
            options: {
                skip,
                limit
            }
        });
        if (post.likes.length === 0) {
            return next(new middlewares_1.ErrorHandler(404, 'No likes found.'));
        }
        const myFollowing = await schemas_1.Follow.findOne({ _user_id: req.user._id });
        const following = myFollowing && myFollowing.following ? myFollowing.following : [];
        const result = post.likes.map(user => {
            return Object.assign(Object.assign({}, user.toObject()), { isFollowing: following.includes(user.id) });
        });
        res.status(200).send((0, utils_1.makeResponseJson)(result));
    } catch (e) {
        console.log('CANT GET POST LIKERS', e);
        next(e);
    }
});
exports.default = router;    //# sourceMappingURL=post.js.map
