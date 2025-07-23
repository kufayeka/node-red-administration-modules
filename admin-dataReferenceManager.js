const { initDataReferencesTable } = require('./dataReferenceManager/db');
const { validate } = require('./dataReferenceManager/validator');
const { formatError } = require('./dataReferenceManager/errors');
const ops = require('./dataReferenceManager/operations');

module.exports = function(RED) {
    function DataReferenceManagerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Get the PostgreSQL configuration node
        const pgConfig = RED.nodes.getNode(config.pgConfig);
        if (!pgConfig) {
            node.status({ fill: 'red', shape: 'ring', text: 'Missing PG config' });
            node.error("Missing PG config");
            return;
        }

        const client = pgConfig.getClient();

        // Initialize tables
        initDataReferencesTable(client).catch(err => {
            node.status({ fill: 'red', shape: 'ring', text: 'Init table failed' });
            node.error(`Table initialization failed: ${err.message}`);
        });

        node.on('input', async (msg, send, done) => {
            node.status({ fill: 'blue', shape: 'dot', text: 'processing' });
            const op = (msg.operation || '').toLowerCase();

            try {
                validate(op, msg.payload);

                const map = {
                    create: 'createDataReference',
                    update: 'updateDataReference',
                    delete: 'deleteDataReference',
                    get: 'getDataReference',
                    getall: 'getAllDataReferences',
                    getbylist: 'getDataReferencesByList'
                };
                const fnName = map[op];
                if (!fnName) {
                    const e = new Error(`Unsupported operation: ${msg.operation}`);
                    e.code = 'UNKNOWN_OPERATION';
                    throw e;
                }

                const result = await ops[fnName](client, msg.payload);

                msg.payload = { success: true, data: result };
                msg.topic = fnName;
                node.status({ fill: 'green', shape: 'dot', text: op });
            } catch (err) {
                msg.payload = formatError(
                    err.code || 'INTERNAL_ERROR',
                    err.message,
                    err.details || null
                );
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: err.code || 'ERROR'
                });
            }

            send(msg);
            done();
        });

        node.on('close', (removed, done) => {
            pgConfig.closeClient().then(() => {
                done();
            }).catch(err => {
                console.error(`[DataReference-Manager] Error closing pool: ${err.message}`);
                done();
            });
        });
    }

    RED.nodes.registerType('Admin-DataReferenceManager', DataReferenceManagerNode);
}