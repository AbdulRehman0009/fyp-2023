'use strict';
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.deleteImageFromStorage = exports.uploadImageToStorage = exports.multer = void 0;
const config_1 = __importDefault(require('..\\config\\config'));
const cloudinary_1 = require('cloudinary');
const multer_1 = __importDefault(require('multer'));
cloudinary_1.v2.config(config_1.default.cloudinary);
exports.multer = (0, multer_1.default)({
    dest: 'uploads/',
    limits: { fileSize: 2 * 1024 * 1024 }
});
const uploadImageToStorage = (file, folder) => {
    if (file) {
        return new Promise(async (resolve, reject) => {
            const opts = {
                folder,
                resource_type: 'auto',
                overwrite: true,
                quality: 'auto'
            };
            if (Array.isArray(file)) {
                const req = file.map(img => {
                    return cloudinary_1.v2.uploader.upload(img.path, opts);
                });
                try {
                    const result = await Promise.all(req);
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            } else {
                try {
                    const result = await cloudinary_1.v2.uploader.upload(file.path, opts);
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            }
        });
    }
};
exports.uploadImageToStorage = uploadImageToStorage;
const deleteImageFromStorage = publicID => {
    if (publicID) {
        return new Promise(async (resolve, reject) => {
            if (Array.isArray(publicID)) {
                try {
                    await cloudinary_1.v2.api.delete_resources(publicID);
                    resolve({ state: true });
                } catch (err) {
                    reject(err);
                }
            } else {
                try {
                    await cloudinary_1.v2.uploader.destroy(publicID, { invalidate: true });
                    resolve({ state: true });
                } catch (err) {
                    reject(err);
                }
            }
        });
    }
};
exports.deleteImageFromStorage = deleteImageFromStorage;    //# sourceMappingURL=cloudinary.js.map
