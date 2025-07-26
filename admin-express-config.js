module.exports = function(RED) {
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
        app.listen(port, '0.0.0.0', () => {
            node.log(`Starting Express server on port ${port}`);
        });


        node.app = app;

        node.on('close', function () {
            node.server.close();
        });
    }

    RED.nodes.registerType('express-config', ExpressConfigNode);
};
