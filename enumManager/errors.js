function formatError(code, message, details = null) {
    return {
        success: false,
        error: {
            code: code || 'INTERNAL_ERROR',
            message: message || 'An internal error occurred',
            details: details || null
        }
    };
}

module.exports = {
    formatError
};