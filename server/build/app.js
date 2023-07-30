'use strict';
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
const cors_1 = __importDefault(require('cors'));
const csurf_1 = __importDefault(require('csurf'));
const debug_1 = __importDefault(require('debug'));
const express_1 = __importDefault(require('express'));
const express_session_1 = __importDefault(require('express-session'));
const helmet_1 = __importDefault(require('helmet'));
const hpp_1 = __importDefault(require('hpp'));
const http_1 = __importDefault(require('http'));
const http_errors_1 = __importDefault(require('http-errors'));
const morgan_1 = __importDefault(require('morgan'));
const passport_1 = __importDefault(require('passport'));
const config_1 = __importDefault(require('./config\\config'));
const passport_2 = __importDefault(require('./config\\passport'));
const socket_1 = __importDefault(require('./config\\socket'));
const db_1 = __importDefault(require('./db\\db'));
const error_middleware_1 = __importDefault(require('./middlewares\\error.middleware'));
const createRouter_1 = __importDefault(require('./routes\\createRouter'));
const debug = (0, debug_1.default)('server:server');
console.log(config_1.default);
class Express {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = http_1.default.createServer(this.app);
        (0, db_1.default)();
        this.initializeMiddlewares();
        (0, socket_1.default)(this.app, this.server);
        (0, passport_2.default)(passport_1.default);
    }
    initializeMiddlewares() {
        this.app.disable('x-powered-by');
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use((0, cors_1.default)(config_1.default.cors));
        this.app.set('trust proxy', 1);
        this.app.use((0, morgan_1.default)('dev'));
        this.app.use((0, helmet_1.default)());
        this.app.use((0, hpp_1.default)());
        this.app.use((0, express_session_1.default)(config_1.default.session));
        this.app.use(passport_1.default.initialize());
        this.app.use(passport_1.default.session());
        this.app.use('/api', createRouter_1.default);
        // catch 404 and forward to error handler
        this.app.use(function (req, res, next) {
            next((0, http_errors_1.default)(404));
        });
        // error handler
        this.app.use((0, csurf_1.default)());
        this.app.use(error_middleware_1.default);
    }
    onError() {
        this.server.on('error', error => {
            if (error.syscall !== 'listen') {
                throw error;
            }
            const bind = typeof config_1.default.server.port === 'string' ? 'Pipe ' + config_1.default.server.port : 'Port ' + config_1.default.server.port;
            // handle specific listen errors with friendly messages
            switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
            default:
                throw error;
            }
        });
    }
    onListening() {
        this.server.on('listening', () => {
            const addr = this.server.address();
            const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
            debug('Listening on ' + bind);
        });
    }
    listen() {
        this.server.listen(config_1.default.server.port, () => {
            console.log(`# Application is listening on port ${ config_1.default.server.port } #`);
        });
    }
}
exports.default = Express;    //# sourceMappingURL=app.js.map
