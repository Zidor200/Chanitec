const pool = require('../../database/pool');

// Get all supply items for a quote
const getSupplyItemsByQuoteId = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM supply_items WHERE quote_id = ?', [req.params.quoteId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching supply items:', error);
        res.status(500).json({ error: 'Error fetching supply items' });
    }
};

// Get supply item by ID
const getSupplyItemById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM supply_items WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Supply item not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching supply item:', error);
        res.status(500).json({ error: 'Error fetching supply item' });
    }
};

// Create new supply item
const createSupplyItem = async (req, res) => {
    const {
        description,
        quantity,
        priceEuro,
        priceDollar,
        unitPriceDollar,
        totalPriceDollar
    } = req.body;

    // Get quote_id from the URL parameter
    const quote_id = req.params.quoteId;

    if (!quote_id || !description || !quantity || !priceEuro) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['quote_id', 'description', 'quantity', 'priceEuro']
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO supply_items (
                id, quote_id, description, quantity, price_euro,
                price_dollar, unit_price_dollar, total_price_dollar
            ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
            [quote_id, description, quantity, priceEuro, priceDollar, unitPriceDollar, totalPriceDollar]
        );

        // Get the newly created item using description and quote_id
        const [rows] = await pool.query(
            'SELECT * FROM supply_items WHERE quote_id = ? AND description = ? ORDER BY created_at DESC LIMIT 1',
            [quote_id, description]
        );

        if (rows.length === 0) {
            throw new Error('Failed to retrieve newly created supply item');
        }

        // Convert backend property names to frontend property names
        const newItem = {
            id: rows[0].id,
            description: rows[0].description,
            quantity: rows[0].quantity,
            priceEuro: rows[0].price_euro,
            priceDollar: rows[0].price_dollar,
            unitPriceDollar: rows[0].unit_price_dollar,
            totalPriceDollar: rows[0].total_price_dollar,
            created_at: rows[0].created_at,
            updated_at: rows[0].updated_at
        };

        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creating supply item:', error);
        res.status(500).json({ error: 'Error creating supply item' });
    }
};

// Update supply item
const updateSupplyItem = async (req, res) => {
    const {
        description,
        quantity,
        price_euro,
        price_dollar,
        unit_price_dollar,
        total_price_dollar
    } = req.body;

    if (!description || !quantity || !price_euro) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE supply_items SET
                description = ?, quantity = ?, price_euro = ?,
                price_dollar = ?, unit_price_dollar = ?, total_price_dollar = ?
            WHERE id = ?`,
            [description, quantity, price_euro, price_dollar, unit_price_dollar, total_price_dollar, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Supply item not found' });
        }
        const [updatedItem] = await pool.query('SELECT * FROM supply_items WHERE id = ?', [req.params.id]);
        res.json(updatedItem[0]);
    } catch (error) {
        console.error('Error updating supply item:', error);
        res.status(500).json({ error: 'Error updating supply item' });
    }
};

// Delete supply item
const deleteSupplyItem = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM supply_items WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Supply item not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting supply item:', error);
        res.status(500).json({ error: 'Error deleting supply item' });
    }
};

module.exports = {
    getSupplyItemsByQuoteId,
    getSupplyItemById,
    createSupplyItem,
    updateSupplyItem,
    deleteSupplyItem
};