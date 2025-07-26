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

        // Safe whitelist handling
        const rawWhitelist = (config.whitelist || "").split(',').map(o => o.trim()).filter(Boolean);
        const corsOptions = {
            origin: function (origin, callback) {
                if (!origin || rawWhitelist.includes(origin)) {
                    callback(null, true);
                } else {
                    node.warn(`Blocked CORS origin: ${origin}`);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true
        };

        app.use(cors(corsOptions));

        const port = parseInt(config.port) || 7000;

        try {
            // Avoid duplicate servers on redeploy
            if (node.server && node.server.listening) {
                node.warn(`Server already running on port ${port}, closing old instance...`);
                node.server.close();
            }

            node.log(`Starting Express server on port ${port}`);
            node.server = app.listen(port, () => {
                node.log(`Express server started on port ${port}`);
            });

            // Attach express app to node for other nodes to use
            node.app = app;

        } catch (err) {
            node.error(`Failed to start server on port ${port}: ${err.message}`);
        }

        node.on('close', function () {
            if (node.server && node.server.close) {
                node.log(`Shutting down Express server on port ${port}`);
                node.server.close();
            }
        });
    }

    RED.nodes.registerType('express-config', ExpressConfigNode);
};
