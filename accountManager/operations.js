const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAccount(client, { fullname, role, username, password, status = 'active' }) {
    const now = new Date().toISOString();
    const { rows } = await client.query(
        'SELECT id FROM accounts WHERE username=$1 AND delete_at IS NULL',
        [username]
    );
    if (rows.length) {
        const e = new Error('Username already exists');
        e.code = 'USERNAME_EXISTS';
        throw e;
    }
    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await client.query(
        `INSERT INTO accounts
      (id,fullname,role,username,password,status,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
        [id, fullname, role, username, hash, status, now]
    );
    return { id };
}

async function updateAccount(client, { id, fullname, role, username, password, status }) {
    const now = new Date().toISOString();
    if (username) {
        const chk = await client.query(
            'SELECT id FROM accounts WHERE username=$1 AND id<>$2 AND delete_at IS NULL',
            [username, id]
        );
        if (chk.rows.length) {
            const e = new Error('Username already used');
            e.code = 'USERNAME_EXISTS';
            throw e;
        }
    }
    const sets = ['fullname=$1', 'role=$2', 'username=$3', 'status=$4', 'updated_at=$5'];
    const params = [fullname, role, username, status, now];
    let idx = 6;
    if (password) {
        const h = await bcrypt.hash(password, 10);
        sets.push(`password=$${idx}`);
        params.push(h);
        idx++;
    }
    params.push(id);
    await client.query(
        `UPDATE accounts SET ${sets.join(',')}
     WHERE id=$${idx} AND delete_at IS NULL`,
        params
    );
    return { id };
}

async function deleteAccount(client, { id }) {
    const now = new Date().toISOString();
    await client.query(
        'UPDATE accounts SET delete_at=$1 WHERE id=$2 AND delete_at IS NULL',
        [now, id]
    );
    return { id };
}

async function hardDeleteAccount(client, { id }) {
    const res = await client.query(
        'DELETE FROM accounts WHERE id=$1',
        [id]
    );
    return { id, deletedCount: res.rowCount };
}

async function findAccount(client, { id }) {
    const { rows } = await client.query(
        `SELECT id,fullname,role,username,status,created_at,updated_at,delete_at,last_login
     FROM accounts WHERE id=$1 AND delete_at IS NULL`,
        [id]
    );
    return rows[0] || null;
}

async function findAllAccounts(client) {
    const { rows } = await client.query(
        `SELECT id,fullname,role,username,status,created_at,updated_at,delete_at,last_login
     FROM accounts WHERE delete_at IS NULL
     ORDER BY fullname`
    );
    return rows;
}

async function loginAccount(client, { username, password }) {
    const { rows } = await client.query(
        'SELECT * FROM accounts WHERE username=$1 AND delete_at IS NULL',
        [username]
    );
    if (!rows.length) {
        const e = new Error('User not found');
        e.code = 'USER_NOT_FOUND';
        throw e;
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
        const e = new Error('Wrong password');
        e.code = 'INVALID_CREDENTIALS';
        throw e;
    }
    const now = new Date().toISOString();
    await client.query(
        'UPDATE accounts SET last_login=$1 WHERE id=$2',
        [now, user.id]
    );
    delete user.password;
    user.last_login = now;
    return user;
}

async function getDeletedAccount(client, { id }) {
    const { rows } = await client.query(
        `SELECT id,fullname,role,username,status,
            created_at,updated_at,last_login,delete_at
     FROM accounts
     WHERE id=$1 AND delete_at IS NOT NULL`,
        [id]
    );
    return rows[0] || null;
}

async function getAllDeletedAccount(client) {
    const { rows } = await client.query(
        `SELECT id,fullname,role,username,status,
            created_at,updated_at,last_login,delete_at
     FROM accounts
     WHERE delete_at IS NOT NULL
     ORDER BY delete_at DESC`
    );
    return rows;
}

async function recoverDeletedAccount(client, { id }) {
    const now = new Date().toISOString();
    const res = await client.query(
        `UPDATE accounts
     SET delete_at = NULL, updated_at = $1
     WHERE id=$2 AND delete_at IS NOT NULL`,
        [now, id]
    );
    return { id, recovered: res.rowCount };
}

module.exports = {
    createAccount,
    updateAccount,
    deleteAccount,
    hardDeleteAccount,
    findAccount,
    findAllAccounts,
    loginAccount,
    getDeletedAccount,
    getAllDeletedAccount,
    recoverDeletedAccount
};