const { v4: uuidv4 } = require('uuid');

async function createDataReference(client, { category, value, description }) {
    const now = new Date().toISOString();
    // Pastikan value adalah objek JSON yang valid
    const valueJson = typeof value === 'object' ? value : { value: value, title: 'Default Title' };
    const { rows } = await client.query(
        'SELECT id FROM data_reference WHERE category = $1 AND (value->>\'value\') = $2',
        [category, valueJson.value]
    );
    if (rows.length) {
        throw new Error('DataReference value already exists');
    }
    const id = uuidv4();
    const res = await client.query(
        `INSERT INTO data_reference (id, category, value, description, updated_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, category, value, description`,
        [id, category, valueJson, description, now]
    );
    return res.rows[0];
}

async function updateDataReference(client, { id, category, value, description }) {
    const now = new Date().toISOString();
    // Pastikan value adalah objek JSON yang valid
    const valueJson = typeof value === 'object' ? value : { value: value, title: 'Default Title' };
    const res = await client.query(
        `UPDATE data_reference SET category = $1, value = $2, description = $3, updated_at = $4
         WHERE id = $5 RETURNING id, category, value, description`,
        [category, valueJson, description, now, id]
    );
    if (!res.rows.length) {
        throw new Error('DataReference not found');
    }
    return res.rows[0];
}

async function deleteDataReference(client, { id }) {
    const res = await client.query(
        'DELETE FROM data_reference WHERE id = $1 RETURNING id',
        [id]
    );
    if (!res.rows.length) {
        throw new Error('DataReference not found');
    }
    return { id: res.rows[0].id };
}

async function getDataReference(client, { id }) {
    const { rows } = await client.query(
        'SELECT id, category, value, description, created_at, updated_at FROM data_reference WHERE id = $1',
        [id]
    );
    return rows[0] || null;
}

async function getAllDataReferences(client, { category } = {}) {
    const query = category
        ? 'SELECT id, category, value, description, created_at, updated_at FROM data_reference WHERE category = $1'
        : 'SELECT id, category, value, description, created_at, updated_at FROM data_reference';
    const params = category ? [category] : [];
    const { rows } = await client.query(query, params);
    return rows;
}

module.exports = {
    createDataReference,
    updateDataReference,
    deleteDataReference,
    getDataReference,
    getAllDataReferences
};