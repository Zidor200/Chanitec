const pool = require('../../database/pool');

class Client {
    static async create({ name, email, phone, address }) {
        const [result] = await pool.query(
            'INSERT INTO clients (id, name, email, phone, address) VALUES (UUID(), ?, ?, ?, ?)',
            [name, email, phone, address]
        );
        return this.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM clients');
        return rows;
    }

    static async update(id, { name, email, phone, address }) {
        await pool.query(
            'UPDATE clients SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            [name, email, phone, address, id]
        );
        return this.findById(id);
    }

    static async delete(id) {
        await pool.query('DELETE FROM clients WHERE id = ?', [id]);
    }

    static async getSites(clientId) {
        const [rows] = await pool.query('SELECT * FROM sites WHERE client_id = ?', [clientId]);
        return rows;
    }
}

module.exports = Client;