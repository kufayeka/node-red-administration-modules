// errors.js – formatting error response terstruktur
function formatError(code, message, details = null) {
    const err = { code, message };
    if (details) err.details = details;
    return { success: false, error: err };
}

module.exports = { formatError };
