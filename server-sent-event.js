module.exports = function (RED) {
    function SseLoopbackNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const endpoint = config.endpoint || '/sse';
        const keepAliveInterval = parseInt(config.keepAliveInterval) || 15000;
        const updateInterval = parseInt(config.updateInterval) || 5000;

        RED.httpNode.get(endpoint, (req, res) => {
            res.set({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            });
            const cookies = req.cookies;
            console.log(req);

            // Keep-alive interval
            const keepAlive = setInterval(() => {
                if (res.writable) res.write(':\n\n');
                else clearInterval(keepAlive);
            }, keepAliveInterval);

            // Send random number at intervals
            const updateTimer = setInterval(() => {
                if (res.writable) {
                    const randomNumber = Math.floor(Math.random() * 1000); // Random number 0-999
                    res.write(`data: ${randomNumber}\n\n`);
                } else {
                    clearInterval(updateTimer);
                }
            }, updateInterval);

            // Send initial random number
            const initialRandomNumber = Math.floor(Math.random() * 1000);
            res.write(`data: ${cookies} - ${initialRandomNumber}\n\n`);

            req.on('close', () => {
                clearInterval(keepAlive);
                clearInterval(updateTimer);
                if (res.writable) res.end();
            });
        });
    }
    RED.nodes.registerType('server-sent-event', SseLoopbackNode);
};