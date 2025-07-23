const { v4: uuidv4 } = require('uuid');

async function initDataReferencesTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS data_reference (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            category TEXT NOT NULL,
            value JSONB NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (category,value)
            );
    `);
    // Pastikan ekstensi uuid tersedia di PostgreSQL
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
}

module.exports = {
    initDataReferencesTable
};