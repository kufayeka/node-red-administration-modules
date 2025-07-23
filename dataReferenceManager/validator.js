const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

const schemas = {
    create: {
        type: 'object',
        required: ['category', 'value'],
        properties: {
            category: { type: 'string', minLength: 1 },
            value: {
                type: 'object',
                required: ['value', 'title'],
                properties: {
                    value: {}, // any type
                    title: { type: 'string', minLength: 1 }
                },
                additionalProperties: false
            },
            description: { type: 'string' }
        },
        additionalProperties: false
    },
    update: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' },
            category: { type: 'string', minLength: 1 },
            value: {
                type: 'object',
                required: ['value', 'title'],
                properties: {
                    value: { type: 'string' },
                    title: { type: 'string', minLength: 1 }
                },
                additionalProperties: false
            },
            description: { type: 'string' }
        },
        additionalProperties: false
    },
    delete: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' }
        },
        additionalProperties: false
    },
    get: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' }
        },
        additionalProperties: false
    },
    getall: {
        type: 'object',
        properties: {
            category: { type: 'string', minLength: 1 }
        },
        additionalProperties: false
    },
    getbylist: {
        type: 'object',
        minProperties: 1,
        patternProperties: {
            '.*': { type: 'string', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' }
        },
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