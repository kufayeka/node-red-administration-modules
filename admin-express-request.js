// admin-express-request.js
module.exports = function (RED) {
    const Ajv = require('ajv');
    const ajv = new Ajv({ allErrors: true });

    function ExpressRequestNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const expressConfig = RED.nodes.getNode(config.server);
        if (!expressConfig) {
            node.error('Express config not found');
            return;
        }

        const app = expressConfig.app;

        // Simpan konfigurasi endpoint untuk generasi client code
        expressConfig.registerEndpoint({
            id: node.id,
            method: config.method || 'get',
            endpoint: config.endpoint,
            schema: config.schema ? JSON.parse(config.schema) : null,
            validate: config.validate,
            paramsSchema: config.paramsSchema ? JSON.parse(config.paramsSchema) : null
        });


        // Validasi schema jika ada
        let validate;
        if (config.validate && config.schema) {
            try {
                validate = ajv.compile(JSON.parse(config.schema));
            } catch (err) {
                node.error(`Invalid JSON schema: ${err.message}`);
                return;
            }
        }

        app[config.method || 'get'](config.endpoint, function (req, res) {
            const msg = {
                req,
                res,
                payload: req.body,
                params: req.params,
                query: req.query,
                cookies: req.cookies
            };

            // Validasi request body jika diaktifkan
            if (config.validate && validate) {
                const valid = validate(req.body);
                if (!valid) {
                    const error = ajv.errorsText(validate.errors);
                    msg.error = `Validation error: ${error}`;
                    msg.responseSent = true; // Tandai bahwa respons sudah dikirim
                    res.status(400).send({ error: msg.error });
                    node.send(msg);
                    return;
                }
            }

            // Hanya kirim msg jika tidak ada error validasi
            node.send(msg);
        });

        node.log(`Registered endpoint: ${config.method.toUpperCase()} ${config.endpoint}`);
    }

    RED.nodes.registerType('express-request', ExpressRequestNode);
};