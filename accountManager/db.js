async function initTables(client) {
    await client.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY,
      fullname TEXT NOT NULL,
      role TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      last_login TIMESTAMPTZ,
      delete_at TIMESTAMPTZ
    );
  `);
}

module.exports = {
    initTables,
};