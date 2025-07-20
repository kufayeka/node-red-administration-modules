const poolMgr = require('./postgres/postgres-pool-manager.js');

module.exports = function(RED) {
    function EventPGConfigNode(config) {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.host = config.host;
        this.port = parseInt(config.port, 10) || 5432;
        this.user = config.user;
        this.database = config.database;
        this.min = parseInt(config.min) || 0;
        this.max = parseInt(config.max) || 10;
        this.idleTimeoutMillis = parseInt(config.idleTimeoutMillis) || 30000;
        this.connectionTimeoutMillis = parseInt(config.connectionTimeoutMillis) || 10000;
        this.password = this.credentials.password || undefined;
        this.poolId = this.id;

        this.options = {
            host: this.host,
            port: this.port,
            user: this.user,
            password: this.password,
            database: this.database,
            min: this.min,
            max: this.max,
            idleTimeoutMillis: this.idleTimeoutMillis,
            connectionTimeoutMillis: this.connectionTimeoutMillis,
        };

        this.getClient = () => poolMgr.getConnection(this.poolId, this.options);
        this.closeClient = () => poolMgr.closeConnection(this.poolId);

        this.on('close', (removed, done) => {
            this.closeClient().then(() => {
                done();
            }).catch(err => {
                console.error(`[Admin-PG-Config] Error closing pool [${this.poolId}]:`, err.message);
                done();
            });
        });
    }

    RED.nodes.registerType('admin-pg-config', EventPGConfigNode, {
        credentials: {
            password: { type: "password" }
        }
    });
};