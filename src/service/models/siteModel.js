const pool = require('../../database/pool');

class Site {
    static async create({ name, address, client_id }) {
        const [result] = await pool.query(
            'INSERT INTO sites (id, name, client_id) VALUES (UUID(), ?, ?)',
            [name,  client_id]
        );
        return this.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM sites WHERE id = ?', [id]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM sites');
        return rows;
    }

    static async findByClientId(clientId) {
        const [rows] = await pool.query('SELECT * FROM sites WHERE client_id = ?', [clientId]);
        return rows;
    }

    static async update(id, { name, address, client_id }) {
        await pool.query(
            'UPDATE sites SET name = ?, address = ?, client_id = ? WHERE id = ?',
            [name, address, client_id, id]
        );
        return this.findById(id);
    }

    static async delete(id) {
        await pool.query('DELETE FROM sites WHERE id = ?', [id]);
    }

    static async getClient(siteId) {
        const [rows] = await pool.query(
            'SELECT c.* FROM clients c JOIN sites s ON c.id = s.client_id WHERE s.id = ?',
            [siteId]
        );
        return rows[0];
    }
}

module.exports = Site;