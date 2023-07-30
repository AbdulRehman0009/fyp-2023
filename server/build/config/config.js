"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const express_session_1 = __importDefault(require("express-session"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const MongoStore = (0, connect_mongo_1.default)(express_session_1.default);
const env = process.env.NODE_ENV || "dev";
if (env === "dev") {
    require("dotenv").config({
        path: path_1.default.join(__dirname, "../../.env-dev"),
    });
}
exports.default = {
    server: {
        env,
        port: process.env.PORT || 9000,
    },
    mongodb: {
        uri: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB_NAME,
    },
    session: {
        key: process.env.SESSION_NAME,
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            expires: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
            secure: env !== "dev",
            sameSite: env === "dev" ? "strict" : "none",
            httpOnly: env !== "dev",
        },
        store: new MongoStore({
            mongooseConnection: mongoose_1.default.connection,
            collection: "session",
        }),
    },
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
        preflightContinue: true,
    },
    cloudinary: {
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    },
};
//# sourceMappingURL=config.js.map