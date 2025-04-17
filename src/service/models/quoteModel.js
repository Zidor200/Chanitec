const pool = require('../../database/pool');

class Quote {
    static async create({
        client_name,
        site_name,
        object,
        date,
        supply_description,
        labor_description,
        supply_exchange_rate,
        supply_margin_rate,
        labor_exchange_rate,
        labor_margin_rate,
        total_supplies_ht,
        total_labor_ht,
        total_ht,
        tva,
        total_ttc
    }) {
        const [result] = await pool.query(
            `INSERT INTO quotes (
                id, client_name, site_name, object, date, supply_description,
                labor_description, supply_exchange_rate, supply_margin_rate,
                labor_exchange_rate, labor_margin_rate, total_supplies_ht,
                total_labor_ht, total_ht, tva, total_ttc
            ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                client_name, site_name, object, date, supply_description,
                labor_description, supply_exchange_rate, supply_margin_rate,
                labor_exchange_rate, labor_margin_rate, total_supplies_ht,
                total_labor_ht, total_ht, tva, total_ttc
            ]
        );
        return this.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM quotes WHERE id = ?', [id]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM quotes');
        return rows;
    }

    static async update(id, {
        client_name,
        site_name,
        object,
        date,
        supply_description,
        labor_description,
        supply_exchange_rate,
        supply_margin_rate,
        labor_exchange_rate,
        labor_margin_rate,
        total_supplies_ht,
        total_labor_ht,
        total_ht,
        tva,
        total_ttc
    }) {
        await pool.query(
            `UPDATE quotes SET
                client_name = ?, site_name = ?, object = ?, date = ?,
                supply_description = ?, labor_description = ?,
                supply_exchange_rate = ?, supply_margin_rate = ?,
                labor_exchange_rate = ?, labor_margin_rate = ?,
                total_supplies_ht = ?, total_labor_ht = ?, total_ht = ?,
                tva = ?, total_ttc = ?
            WHERE id = ?`,
            [
                client_name, site_name, object, date, supply_description,
                labor_description, supply_exchange_rate, supply_margin_rate,
                labor_exchange_rate, labor_margin_rate, total_supplies_ht,
                total_labor_ht, total_ht, tva, total_ttc, id
            ]
        );
        return this.findById(id);
    }

    static async delete(id) {
        await pool.query('DELETE FROM quotes WHERE id = ?', [id]);
    }

    static async getSupplyItems(quoteId) {
        const [rows] = await pool.query('SELECT * FROM supply_items WHERE quote_id = ?', [quoteId]);
        return rows;
    }

    static async getLaborItems(quoteId) {
        const [rows] = await pool.query('SELECT * FROM labor_items WHERE quote_id = ?', [quoteId]);
        return rows;
    }
}

module.exports = Quote;