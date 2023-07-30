"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObjectID = exports.isAuthenticated = void 0;
const mongoose_1 = require("mongoose");
const error_middleware_1 = require("./error.middleware");
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log("CHECK MIDDLEWARE: IS AUTH: ", req.isAuthenticated());
        return next();
    }
    return next(new error_middleware_1.ErrorHandler(401));
}
exports.isAuthenticated = isAuthenticated;
function validateObjectID(...ObjectIDs) {
    return function (req, res, next) {
        ObjectIDs.forEach((id) => {
            if (!(0, mongoose_1.isValidObjectId)(req.params[id])) {
                return next(new error_middleware_1.ErrorHandler(400, `ObjectID ${id} supplied is not valid`));
            }
            else {
                next();
            }
        });
    };
}
exports.validateObjectID = validateObjectID;
//# sourceMappingURL=middlewares.js.map