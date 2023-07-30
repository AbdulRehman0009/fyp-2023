'use strict';
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.validateBody = exports.schemas = void 0;
const middlewares_1 = require('..\\middlewares\\index');
const joi_1 = __importDefault(require('joi'));
const email = joi_1.default.string().email({
    minDomainSegments: 2,
    tlds: {
        allow: [
            'com',
            'net'
        ]
    }
}).required().messages({
    'string.base': `Email should be a type of 'text'`,
    'string.empty': `Email cannot be an empty field`,
    'string.min': `Email should have a minimum length of {#limit}`,
    'any.required': `Email is a required field.`
});
const password = joi_1.default.string().min(8).max(50).required().messages({
    'string.base': `Password should be a type of 'text'`,
    'string.empty': `Password cannot be an empty field`,
    'string.min': `Password should have a minimum length of {#limit}`,
    'any.required': `Password is a required field`
});
const username = joi_1.default.string().required().messages({
    'string.base': 'Username should be of type "text"',
    'string.empty': `Username cannot be an empty field`,
    'string.min': `Username should have a minimum length of {#limit}`,
    'any.required': 'Username field is required'
});
exports.schemas = {
    loginSchema: joi_1.default.object().keys({
        username,
        password
    }).options({ abortEarly: false }),
    registerSchema: joi_1.default.object().keys({
        email,
        password,
        username
    }).options({ abortEarly: false }),
    createPostSchema: joi_1.default.object().keys({
        description: joi_1.default.string(),
        photos: joi_1.default.array(),
        privacy: joi_1.default.string()
    }),
    commentSchema: joi_1.default.object().keys({
        body: joi_1.default.string().required().messages({
            'string.base': 'Comment body should be of type "string"',
            'string.empty': `Comment body cannot be an empty field`,
            'any.required': 'Comment body field is required'
        })
    }),
    editProfileSchema: joi_1.default.object().keys({
        firstname: joi_1.default.string().empty(''),
        lastname: joi_1.default.string().empty(''),
        bio: joi_1.default.string().empty(''),
        gender: joi_1.default.string().empty(''),
        birthday: joi_1.default.date().empty('')
    })
};
const validateBody = schema => {
    return (req, res, next) => {
        const result = schema.validate(req.body);
        if (result.error) {
            console.log(result.error);
            return next(new middlewares_1.ErrorHandler(400, result.error.details[0].message));
        } else {
            if (!req.value) {
                req.value = {};
            }
            req.value['body'] = result.value;
            next();
        }
    };
};
exports.validateBody = validateBody;    //# sourceMappingURL=validations.js.map
