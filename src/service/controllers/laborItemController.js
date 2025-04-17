const pool = require('../../database/pool');

// Get all labor items for a quote
const getLaborItemsByQuoteId = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM labor_items WHERE quote_id = ?', [req.params.quoteId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching labor items:', error);
        res.status(500).json({ error: 'Error fetching labor items' });
    }
};

// Get labor item by ID
const getLaborItemById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM labor_items WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Labor item not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching labor item:', error);
        res.status(500).json({ error: 'Error fetching labor item' });
    }
};

// Create new labor item
const createLaborItem = async (req, res) => {
    try {
        const {
            description,
            nb_technicians,
            nb_hours,
            weekend_multiplier,
            price_euro,
            price_dollar,
            unit_price_dollar,
            total_price_dollar
        } = req.body;

        // Get quote_id from the URL parameter
        const quote_id = req.params.quoteId;

        // Validate required fields and data types
        if (!quote_id || quote_id.length !== 36) {
            return res.status(400).json({ error: 'Invalid quote_id format' });
        }

        // Validate and convert data types
        const validatedData = {
            quote_id,
            description: description ? String(description) : null,
            nb_technicians: nb_technicians ? parseInt(nb_technicians) : null,
            nb_hours: nb_hours ? parseFloat(Number(nb_hours).toFixed(2)) : null,
            weekend_multiplier: weekend_multiplier ? parseFloat(Number(weekend_multiplier).toFixed(2)) : null,
            price_euro: price_euro ? parseFloat(Number(price_euro).toFixed(2)) : null,
            price_dollar: price_dollar ? parseFloat(Number(price_dollar).toFixed(2)) : null,
            unit_price_dollar: unit_price_dollar ? parseFloat(Number(unit_price_dollar).toFixed(2)) : null,
            total_price_dollar: total_price_dollar ? parseFloat(Number(total_price_dollar).toFixed(2)) : null
        };

        // Validate required fields
        if (!validatedData.description ||
            validatedData.nb_technicians === null ||
            validatedData.nb_hours === null ||
            validatedData.weekend_multiplier === null ||
            validatedData.price_euro === null) {
            return res.status(400).json({
                error: 'Missing or invalid required fields',
                required: {
                    description: 'text',
                    nb_technicians: 'integer',
                    nb_hours: 'decimal(10,2)',
                    weekend_multiplier: 'decimal(10,2)',
                    price_euro: 'decimal(10,2)'
                }
            });
        }

        // Validate numeric fields are positive
        if (validatedData.nb_technicians <= 0 ||
            validatedData.nb_hours <= 0 ||
            validatedData.weekend_multiplier <= 0 ||
            validatedData.price_euro <= 0) {
            return res.status(400).json({ error: 'Numeric fields must be positive values' });
        }

        // Insert the labor item with UUID generation
        const [result] = await pool.query(
            `INSERT INTO labor_items (
                id, quote_id, description, nb_technicians, nb_hours,
                weekend_multiplier, price_euro, price_dollar,
                unit_price_dollar, total_price_dollar
            ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                validatedData.quote_id,
                validatedData.description,
                validatedData.nb_technicians,
                validatedData.nb_hours,
                validatedData.weekend_multiplier,
                validatedData.price_euro,
                validatedData.price_dollar,
                validatedData.unit_price_dollar,
                validatedData.total_price_dollar
            ]
        );

        // Fetch the newly created item
        const [rows] = await pool.query(
            'SELECT * FROM labor_items WHERE quote_id = ? AND description = ? ORDER BY created_at DESC LIMIT 1',
            [quote_id, validatedData.description]
        );

        if (rows.length === 0) {
            throw new Error('Failed to retrieve newly created labor item');
        }

        // Transform the response to match frontend expectations
        const newItem = {
            id: rows[0].id,
            description: rows[0].description,
            nbTechnicians: rows[0].nb_technicians,
            nbHours: parseFloat(rows[0].nb_hours),
            weekendMultiplier: parseFloat(rows[0].weekend_multiplier),
            priceEuro: parseFloat(rows[0].price_euro),
            priceDollar: rows[0].price_dollar ? parseFloat(rows[0].price_dollar) : null,
            unitPriceDollar: rows[0].unit_price_dollar ? parseFloat(rows[0].unit_price_dollar) : null,
            totalPriceDollar: rows[0].total_price_dollar ? parseFloat(rows[0].total_price_dollar) : null,
            created_at: rows[0].created_at,
            updated_at: rows[0].updated_at
        };

        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creating labor item:', error);
        res.status(500).json({
            error: 'Error creating labor item',
            details: error.message
        });
    }
};

// Update labor item
const updateLaborItem = async (req, res) => {
    const {
        description,
        nb_technicians,
        nb_hours,
        weekend_multiplier,
        price_euro,
        price_dollar,
        unit_price_dollar,
        total_price_dollar
    } = req.body;

    if (!description || !nb_technicians || !nb_hours || !weekend_multiplier || !price_euro) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE labor_items SET
                description = ?, nb_technicians = ?, nb_hours = ?,
                weekend_multiplier = ?, price_euro = ?, price_dollar = ?,
                unit_price_dollar = ?, total_price_dollar = ?
            WHERE id = ?`,
            [
                description, nb_technicians, nb_hours,
                weekend_multiplier, price_euro, price_dollar,
                unit_price_dollar, total_price_dollar, req.params.id
            ]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Labor item not found' });
        }
        const [updatedItem] = await pool.query('SELECT * FROM labor_items WHERE id = ?', [req.params.id]);
        res.json(updatedItem[0]);
    } catch (error) {
        console.error('Error updating labor item:', error);
        res.status(500).json({ error: 'Error updating labor item' });
    }
};

// Delete labor item
const deleteLaborItem = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM labor_items WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Labor item not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting labor item:', error);
        res.status(500).json({ error: 'Error deleting labor item' });
    }
};

module.exports = {
    getLaborItemsByQuoteId,
    getLaborItemById,
    createLaborItem,
    updateLaborItem,
    deleteLaborItem
};