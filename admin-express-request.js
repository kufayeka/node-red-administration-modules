module.exports = function (RED) {
    function ExpressRequestNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const expressConfig = RED.nodes.getNode(config.server);
        if (!expressConfig) {
            node.error("Express config not found");
            return;
        }

        const app = expressConfig.app;

        app[config.method || 'get'](config.endpoint, function (req, res) {
            const msg = {
                req,
                res,
                payload: req.body,
                params: req.params,
                query: req.query,
                cookies: req.cookies
            };
            node.send(msg);
        });

        node.log(`Registered endpoint: ${config.method.toUpperCase()} ${config.endpoint}`);
    }

    RED.nodes.registerType("express-request", ExpressRequestNode);
};
