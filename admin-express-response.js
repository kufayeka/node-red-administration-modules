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

            // Hanya kirim respons jika belum dikirim sebelumnya
            if (!msg.responseSent) {
                msg.res.status(msg.statusCode || 200).send(msg.payload);
            } else {
                node.warn('Response already sent by previous node, skipping send.');
            }
        });
    }

    RED.nodes.registerType('express-response', ExpressResponseNode);
};