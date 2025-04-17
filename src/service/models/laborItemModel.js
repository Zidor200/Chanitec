const pool = require('../../database/pool');

class LaborItem {
    static async create({
        quote_id,
        description,
        nb_technicians,
        nb_hours,
        weekend_multiplier,
        price_euro,
        price_dollar,
        unit_price_dollar,
        total_price_dollar
    }) {
        const [result] = await pool.query(
            `INSERT INTO labor_items (
                id, quote_id, description, nb_technicians, nb_hours,
                weekend_multiplier, price_euro, price_dollar,
                unit_price_dollar, total_price_dollar
            ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                quote_id, description, nb_technicians, nb_hours,
                weekend_multiplier, price_euro, price_dollar,
                unit_price_dollar, total_price_dollar
            ]
        );
        return this.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM labor_items WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByQuoteId(quoteId) {
        const [rows] = await pool.query('SELECT * FROM labor_items WHERE quote_id = ?', [quoteId]);
        return rows;
    }

    static async update(id, {
        description,
        nb_technicians,
        nb_hours,
        weekend_multiplier,
        price_euro,
        price_dollar,
        unit_price_dollar,
        total_price_dollar
    }) {
        await pool.query(
            `UPDATE labor_items SET
                description = ?, nb_technicians = ?, nb_hours = ?,
                weekend_multiplier = ?, price_euro = ?, price_dollar = ?,
                unit_price_dollar = ?, total_price_dollar = ?
            WHERE id = ?`,
            [
                description, nb_technicians, nb_hours,
                weekend_multiplier, price_euro, price_dollar,
                unit_price_dollar, total_price_dollar, id
            ]
        );
        return this.findById(id);
    }

    static async delete(id) {
        await pool.query('DELETE FROM labor_items WHERE id = ?', [id]);
    }

    static async getQuote(laborItemId) {
        const [rows] = await pool.query(
            'SELECT q.* FROM quotes q JOIN labor_items l ON q.id = l.quote_id WHERE l.id = ?',
            [laborItemId]
        );
        return rows[0];
    }
}

module.exports = LaborItem;