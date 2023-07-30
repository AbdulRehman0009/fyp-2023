'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const constants_1 = require('..\\..\\..\\constants\\constants');
const utils_1 = require('..\\..\\..\\helpers\\utils');
const middlewares_1 = require('..\\..\\..\\middlewares\\index');
const schemas_1 = require('..\\..\\..\\schemas\\index');
const express_1 = require('express');
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/v1/notifications', middlewares_1.isAuthenticated, async (req, res, next) => {
    try {
        let offset = parseInt(req.query.offset) || 0;
        const limit = constants_1.NOTIFICATIONS_LIMIT;
        const skip = offset * limit;
        const notifications = await schemas_1.Notification.find({ target: req.user._id }).populate('target initiator', 'profilePicture username fullname').sort({ createdAt: -1 }).limit(limit).skip(skip);
        const unreadCount = await schemas_1.Notification.find({
            target: req.user._id,
            unread: true
        });
        const count = await schemas_1.Notification.find({ target: req.user._id });
        const result = {
            notifications,
            unreadCount: unreadCount.length,
            count: count.length
        };
        if (notifications.length === 0 && offset === 0) {
            return next(new middlewares_1.ErrorHandler(404, 'You have no notifications.'));
        } else if (notifications.length === 0 && offset >= 1) {
            return next(new middlewares_1.ErrorHandler(404, 'No more notifications.'));
        }
        res.status(200).send((0, utils_1.makeResponseJson)(result));
    } catch (e) {
        console.log(e);
        next(e);
    }
});
router.get('/v1/notifications/unread', middlewares_1.isAuthenticated, async (req, res, next) => {
    try {
        const notif = await schemas_1.Notification.find({
            target: req.user._id,
            unread: true
        });
        res.status(200).send((0, utils_1.makeResponseJson)({ count: notif.length }));
    } catch (e) {
        console.log('CANT GET UNREAD NOTIFICATIONS', e);
        next(e);
    }
});
router.patch('/v1/notifications/mark', middlewares_1.isAuthenticated, async (req, res, next) => {
    try {
        await schemas_1.Notification.updateMany({ target: req.user._id }, { $set: { unread: false } });
        res.status(200).send((0, utils_1.makeResponseJson)({ state: false }));
    } catch (e) {
        console.log('CANT MARK ALL AS UNREAD', e);
        next(e);
    }
});
router.patch('/v1/read/notification/:id', middlewares_1.isAuthenticated, async (req, res, next) => {
    try {
        const {id} = req.params;
        const notif = await schemas_1.Notification.findById(id);
        if (!notif)
            return res.sendStatus(400);
        const result = await schemas_1.Notification.findByIdAndUpdate(id, { $set: { unread: false } });
        res.status(200).send((0, utils_1.makeResponseJson)({ state: false }));    // state = false EQ unread = false
    } catch (e) {
        next(e);
    }
});
exports.default = router;    //# sourceMappingURL=notification.js.map
