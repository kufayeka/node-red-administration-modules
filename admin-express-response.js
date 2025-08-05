// admin-express-response.js
module.exports = function (RED) {
    function ExpressResponseNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            if (!msg.res) {
                node.error('Missing msg.res');
                return;
            }

            msg.res.status(msg.statusCode || 200).send(msg.payload);
        });
    }

    RED.nodes.registerType('express-response', ExpressResponseNode);
};