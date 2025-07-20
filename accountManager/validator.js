// validator.js – payload validation menggunakan AJV
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

const schemas = {
    create: {
        type: 'object',
        required: ['fullname','role','username','password','status'],
        properties: {
            fullname: { type: 'string', minLength: 1 },
            role: {
                type: 'string',
                enum: ['administrator','operator','maintenance','dev']
            },
            username: { type: 'string', minLength: 1 },
            password: { type: 'string', minLength: 6 },
            status: {
                type: 'string',
                enum: ['active','inactive']
            }
        },
        additionalProperties: false
    },
    update: {
        type: 'object',
        required: ['id'],
        properties: {
            id:       { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' },
            fullname: { type: 'string' },
            role: {
                type: 'string',
                enum: ['administrator','operator','maintenance','dev']
            },
            username: { type: 'string' },
            password: { type: 'string', minLength: 6 },
            status: {
                type: 'string',
                enum: ['active','inactive']
            }
        },
        additionalProperties: false
    },
    delete: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' }
        },
        additionalProperties: false
    },
    harddelete: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' }
        },
        additionalProperties: false
    },
    find: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' }
        },
        additionalProperties: false
    },
    findall: {
        type: 'object',
        properties: {},
        additionalProperties: false
    },
    login: {
        type: 'object',
        required: ['username','password'],
        properties: {
            username: { type: 'string', minLength: 1 },
            password: { type: 'string', minLength: 6 }
        },
        additionalProperties: false
    },
    recoverdeletedaccount: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' }
        },
        additionalProperties: false
    },
    getdeletedaccount: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' }
        },
        additionalProperties: false
    },
    getalldeletedaccount: {
        type: 'object',
        properties: {},
        additionalProperties: false
    }
};

const validators = {};
for (const op in schemas) {
    validators[op] = ajv.compile(schemas[op]);
}

function validate(op, payload) {
    const v = validators[op];
    if (!v) {
        const e = new Error(`Unknown operation: ${op}`);
        e.code = 'UNKNOWN_OPERATION';
        throw e;
    }
    if (!v(payload)) {
        const e = new Error('Invalid payload');
        e.code = 'VALIDATION_ERROR';
        e.details = v.errors;
        throw e;
    }
}

module.exports = { validate };
