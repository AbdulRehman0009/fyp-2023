'use strict';
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
const config_1 = __importDefault(require('./config'));
const UserSchema_1 = __importDefault(require('..\\schemas\\UserSchema'));
function default_1(app, server) {
    const io = require('socket.io')(server, {
        cors: {
            origin: config_1.default.cors.origin || 'http://localhost:3000',
            methods: [
                'GET',
                'POST',
                'PATCH'
            ],
            credentials: true
        }
    });
    app.set('io', io);
    io.on('connection', socket => {
        socket.on('userConnect', id => {
            UserSchema_1.default.findById(id).then(user => {
                if (user) {
                    socket.join(user._id.toString());
                    console.log('Client connected.');
                }
            }).catch(e => {
                console.log('Invalid user ID, cannot join Socket.');
            });
        });
        socket.on('userDisconnect', userID => {
            socket.leave(userID);
            console.log('Client Disconnected.');
        });
        socket.on('onFollowUser', data => {
            console.log(data);
        });
        socket.on('user-typing', ({user, state}) => {
            io.to(user.id).emit('typing', state);
        });
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
}
exports.default = default_1;    //# sourceMappingURL=socket.js.map
