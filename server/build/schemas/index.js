"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Post = exports.Notification = exports.NewsFeed = exports.Message = exports.Follow = exports.Comment = exports.Chat = exports.Bookmark = void 0;
var BookmarkSchema_1 = require("./BookmarkSchema");
Object.defineProperty(exports, "Bookmark", { enumerable: true, get: function () { return __importDefault(BookmarkSchema_1).default; } });
var ChatSchema_1 = require("./ChatSchema");
Object.defineProperty(exports, "Chat", { enumerable: true, get: function () { return __importDefault(ChatSchema_1).default; } });
var CommentSchema_1 = require("./CommentSchema");
Object.defineProperty(exports, "Comment", { enumerable: true, get: function () { return __importDefault(CommentSchema_1).default; } });
var FollowSchema_1 = require("./FollowSchema");
Object.defineProperty(exports, "Follow", { enumerable: true, get: function () { return __importDefault(FollowSchema_1).default; } });
var MessageSchema_1 = require("./MessageSchema");
Object.defineProperty(exports, "Message", { enumerable: true, get: function () { return __importDefault(MessageSchema_1).default; } });
var NewsFeedSchema_1 = require("./NewsFeedSchema");
Object.defineProperty(exports, "NewsFeed", { enumerable: true, get: function () { return __importDefault(NewsFeedSchema_1).default; } });
var NotificationSchema_1 = require("./NotificationSchema");
Object.defineProperty(exports, "Notification", { enumerable: true, get: function () { return __importDefault(NotificationSchema_1).default; } });
var PostSchema_1 = require("./PostSchema");
Object.defineProperty(exports, "Post", { enumerable: true, get: function () { return __importDefault(PostSchema_1).default; } });
var UserSchema_1 = require("./UserSchema");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return __importDefault(UserSchema_1).default; } });
//# sourceMappingURL=index.js.map