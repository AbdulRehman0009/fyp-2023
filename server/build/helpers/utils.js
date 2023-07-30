"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterWords = exports.makeResponseJson = exports.sessionizeUser = void 0;
const bad_words_1 = __importDefault(require("bad-words"));
const initStatus = {
    status_code: 404,
    success: false,
    data: null,
    error: null,
    timestamp: null
};
const sessionizeUser = (user) => ({
    id: user._id,
    username: user.username,
    fullname: user.fullname,
    profilePicture: user.profilePicture
});
exports.sessionizeUser = sessionizeUser;
const makeResponseJson = (data, success = true) => {
    return Object.assign(Object.assign({}, initStatus), { status_code: 200, success,
        data, timestamp: new Date() });
};
exports.makeResponseJson = makeResponseJson;
const newBadWords = [
    'gago', 'puta', 'animal', 'porn', 'amputa', 'tangina', 'pota', 'puta', 'putangina'
];
const filterWords = new bad_words_1.default();
exports.filterWords = filterWords;
filterWords.addWords(...newBadWords);
//# sourceMappingURL=utils.js.map