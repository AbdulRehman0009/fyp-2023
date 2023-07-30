'use strict';
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
const config_1 = __importDefault(require('..\\config\\config'));
const express_1 = require('express');
const glob_1 = __importDefault(require('glob'));
const routers = glob_1.default.sync(`**/*.${ config_1.default.server.env === 'dev' ? 'ts' : 'js' }`, { cwd: `${ __dirname }/` }).map(filename => require(`./${ filename }`)).filter(router => {
    return router.default && Object.getPrototypeOf(router.default) === express_1.Router;
}).reduce((rootRouter, router) => {
    return rootRouter.use(router.default);
}, (0, express_1.Router)({ mergeParams: true }));
exports.default = routers;    //# sourceMappingURL=createRouter.js.map
