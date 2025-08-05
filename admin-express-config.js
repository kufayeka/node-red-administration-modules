// admin-express-config.js
module.exports = function (RED) {
    const express = require('express');
    const cookieParser = require('cookie-parser');
    const cors = require('cors');

    function ExpressConfigNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Setup Express
        const app = express();
        app.use(express.json());
        app.use(cookieParser());

        const whitelist = config.whitelist.split(',').map(o => o.trim());
        const corsOptions = {
            origin: function (origin, callback) {
                if (!origin || whitelist.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true
        };
        app.use(cors(corsOptions));

        const port = config.port || 7000;
        node.log(`Starting Express server on port ${port}`);
        node.server = app.listen(port);
        node.app = app;

        // Registry untuk menyimpan konfigurasi endpoint
        node.endpoints = [];

        node.registerEndpoint = function (endpointConfig) {
            node.endpoints.push(endpointConfig);
        };

        // Endpoint untuk generate client code
        app.get('/express-config/:id/generate-client', (req, res) => {
            if (req.params.id !== node.id) {
                return res.status(404).send('Node not found');
            }
            const clientCode = generateClientCode(node.endpoints);
            res.send({ code: clientCode });
        });

        node.on('close', function () {
            node.server.close();
        });
    }

    // Fungsi untuk generate client code
    function generateClientCode(endpoints) {
        let code = `import { useApi } from './useApi';\n\nconst { get, post, put, del } = useApi();\n\n`;
        code += `export const eventApi = {\n`;

        endpoints.forEach(endpoint => {
            const method = endpoint.method.toLowerCase();
            const funcName = endpointToFuncName(endpoint.endpoint, method);
            const params = method === 'get' ? '' : 'body';
            let schemaComment = '';

            if (endpoint.schema) {
                schemaComment = `  /**\n   * Request body schema:\n   * ${JSON.stringify(endpoint.schema, null, 2).replace(/\n/g, '\n   * ')}\n   * Example: ${schemaToExample(endpoint.schema)}\n   */\n`;
            }

            code += schemaComment;
            code += `  ${funcName}: (${params}) => ${method}('${endpoint.endpoint}'${params ? ', body' : ''}),\n`;
        });

        code += `};\n`;
        return code;
    }

    // Konversi endpoint ke nama fungsi
    function endpointToFuncName(endpoint, method) {
        const parts = endpoint.split('/').filter(p => p && !p.startsWith(':'));
        const name = parts.map(p => p.replace(/-./g, x => x[1].toUpperCase())).join('');
        return `${method}${name.charAt(0).toUpperCase() + name.slice(1)}`;
    }

    // Buat contoh request body dari schema
    function schemaToExample(schema) {
        if (!schema || !schema.properties) return '{}';
        const example = {};
        for (const [key, prop] of Object.entries(schema.properties)) {
            if (prop.type === 'string') example[key] = 'example';
            else if (prop.type === 'number') example[key] = 123;
            else if (prop.type === 'boolean') example[key] = true;
            else if (prop.type === 'object') example[key] = schemaToExample(prop);
            else if (prop.type === 'array') example[key] = [];
        }
        return JSON.stringify(example);
    }

    RED.nodes.registerType('express-config', ExpressConfigNode);
};