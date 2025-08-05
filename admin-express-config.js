// admin-express-config.js
module.exports = function (RED) {
    const express = require('express');
    const cookieParser = require('cookie-parser');
    const cors = require('cors');

    function ExpressConfigNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

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

        node.endpoints = [];

        node.registerEndpoint = function (endpointConfig) {
            node.endpoints.push(endpointConfig);
        };

        RED.httpAdmin.get('/express-config/generate-client', (req, res) => {
            const expressClientId = req.query.expressClientId;
            if (!expressClientId) return res.status(400).json({ error: 'No expressClientId' });

            console.log(`[${expressClientId}] Client code generated`);

            const configNode = RED.nodes.getNode(expressClientId);
            if (!configNode || !(configNode instanceof ExpressConfigNode)) {
                return res.status(404).json({ error: 'Node not found or not an Express config node' });
            }
            const clientCode = generateClientCode(configNode.endpoints);

            res.setHeader('Content-Disposition', 'attachment; filename="event-api-client.js"');
            res.setHeader('Content-Type', 'application/javascript');
            res.send(clientCode);
        });

        node.on('close', function () {
            node.server.close();
        });
    }

    function generateClientCode(endpoints) {
        let code = `import { useApi } from './useApi';\n\nconst { get, post, put, del } = useApi();\n\n`;
        code += `export const apiServices = {\n`;

        endpoints.forEach(endpoint => {
            const method = endpoint.method.toLowerCase();
            const funcName = endpointToFuncName(endpoint.endpoint, method);

            let paramNames = [];
            let dynamicPath = endpoint.endpoint;
            const paramRegex = /:([a-zA-Z0-9_]+)/g;
            let match;

            // Deteksi param dari path
            while ((match = paramRegex.exec(endpoint.endpoint)) !== null) {
                paramNames.push(match[1]);
                dynamicPath = dynamicPath.replace(match[0], `\$\{${match[1]}\}`);
            }

            const url = `\`${dynamicPath}\``;

            // Body schema
            let bodyKeys = [];
            if (endpoint.schema && endpoint.schema.properties) {
                const requiredProps = endpoint.schema.required || [];
                bodyKeys = Object.keys(endpoint.schema.properties).map(k => {
                    return `${k}${requiredProps.includes(k) ? '' : '?'}`;
                });
            }

            const bodyParam = bodyKeys.length ? `body: { ${bodyKeys.join(', ')} }` : '';
            const paramsParam = paramNames.length ? `params: { ${paramNames.join(', ')} }` : '';

            let functionArgs = '';
            if (bodyParam && paramsParam) {
                functionArgs = `{ ${bodyParam}, ${paramsParam} }`;
            } else if (bodyParam) {
                functionArgs = `{ ${bodyParam} }`;
            } else if (paramsParam) {
                functionArgs = `{ ${paramsParam} }`;
            }

            code += `  ${funcName}: (${functionArgs}) => ${method}(${url}${bodyParam ? `, { body }` : ''}),\n`;
        });

        code += `};\n`;
        return code;
    }

    function endpointToFuncName(endpoint, method) {
        const parts = endpoint.split('/').filter(p => p && !p.startsWith(':'));
        const name = parts.map(p => p.replace(/-./g, x => x[1].toUpperCase())).join('');
        return `${method}${name.charAt(0).toUpperCase() + name.slice(1)}`;
    }

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

    // Fungsi untuk menentukan tipe berdasarkan schema
    function getType(prop) {
        switch (prop.type) {
            case 'string': return 'string';
            case 'number': return 'number';
            case 'boolean': return 'boolean';
            case 'object': return 'object';
            case 'array': return prop.items ? getType(prop.items) + '[]' : 'any[]';
            default: return 'any';
        }
    }

    RED.nodes.registerType('express-config', ExpressConfigNode);
};