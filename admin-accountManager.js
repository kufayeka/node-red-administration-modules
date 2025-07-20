module.exports = function(RED) {
    const { initTables } = require('./accountManager/db');
    const { validate } = require('./accountManager/validator');
    const { formatError } = require('./accountManager/errors');
    const ops = require('./accountManager/operations');

    function AdminAccountManangerNode(config) {
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
        initTables(client).catch(err => {
            node.status({ fill: 'red', shape: 'ring', text: 'Init table failed' });
            node.error(`Table initialization failed: ${err.message}`);
        });

        node.on('input', async (msg, send, done) => {
            node.status({ fill: 'blue', shape: 'dot', text: 'processing' });
            const op = (msg.operation || '').toLowerCase();

            try {
                // Handle logout separately
                if (op === 'logout') {
                    msg.payload = { success: true };
                    msg.cookies = {
                        loggedAccoundId: {
                            value: '',
                            options: { expires: new Date(0), path: '/' }
                        }
                    };
                    node.status({ fill: 'green', shape: 'dot', text: 'logout' });
                    send(msg);
                    return done();
                }

                // Validate payload for all other operations
                validate(op, msg.payload);

                // Dispatch to operations module
                const map = {
                    create: 'createAccount',
                    update: 'updateAccount',
                    delete: 'deleteAccount',
                    harddelete: 'hardDeleteAccount',
                    find: 'findAccount',
                    findall: 'findAllAccounts',
                    login: 'loginAccount',
                    getdeletedaccount: 'getDeletedAccount',
                    getalldeletedaccount: 'getAllDeletedAccount',
                    recoverdeletedaccount: 'recoverDeletedAccount'
                };
                const fnName = map[op];
                if (!fnName) {
                    const e = new Error(`Unsupported operation: ${msg.operation}`);
                    e.code = 'UNKNOWN_OPERATION';
                    throw e;
                }

                const result = await ops[fnName](client, msg.payload);

                // On success, wrap payload
                msg.payload = { success: true, data: result };
                msg.topic = fnName;

                // Set cookie for login operation if enabled
                if (op === 'login' && config.loginCookie === "true") {
                    const cookieOptions = {
                        httpOnly: config.loginCookieHttpOnly === "true",
                        path: '/',
                    };

                    // Only set maxAge if provided and valid
                    const maxAge = parseInt(config.loginCookieMaxAge, 10);
                    if (!isNaN(maxAge) && maxAge > 0) {
                        cookieOptions.maxAge = maxAge * 1000; // Convert seconds to milliseconds
                    }

                    msg.cookies = {
                        loggedAccoundId: {
                            value: result.id, // Store only the user ID
                            options: cookieOptions
                        }
                    };
                }

                node.status({ fill: 'green', shape: 'dot', text: op });
            } catch (err) {
                // Error handling
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
            done();
        });
    }

    RED.nodes.registerType('Admin-AccountManager', AdminAccountManangerNode);
};