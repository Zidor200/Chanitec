const pool = require('../../database/pool');
const crypto = require('crypto');

// Get all quotes
const getAllQuotes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM quotes');

        // Convert field names from snake_case to camelCase for frontend
        const quotes = rows.map(row => ({
            id: row.id,
            clientName: row.client_name,
            siteName: row.site_name,
            object: row.object,
            date: row.date,
            supplyDescription: row.supply_description,
            laborDescription: row.labor_description,
            supplyExchangeRate: row.supply_exchange_rate,
            supplyMarginRate: row.supply_margin_rate,
            laborExchangeRate: row.labor_exchange_rate,
            laborMarginRate: row.labor_margin_rate,
            totalSuppliesHT: row.total_supplies_ht,
            totalLaborHT: row.total_labor_ht,
            totalHT: row.total_ht,
            tva: row.tva,
            totalTTC: row.total_ttc,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.json(quotes);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ error: 'Error fetching quotes' });
    }
};

// Get quote by ID
const getQuoteById = async (req, res) => {
    try {
        // Get the quote
        const [quoteRows] = await pool.query('SELECT * FROM quotes WHERE id = ?', [req.params.id]);

        if (quoteRows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        // Get supply items for this quote
        const [supplyItems] = await pool.query(
            'SELECT * FROM supply_items WHERE quote_id = ?',
            [req.params.id]
        );

        // Get labor items for this quote
        const [laborItems] = await pool.query(
            'SELECT * FROM labor_items WHERE quote_id = ?',
            [req.params.id]
        );

        // Format the response
        const quote = {
            id: quoteRows[0].id,
            clientName: quoteRows[0].client_name,
            siteName: quoteRows[0].site_name,
            object: quoteRows[0].object,
            date: quoteRows[0].date,
            supplyDescription: quoteRows[0].supply_description,
            laborDescription: quoteRows[0].labor_description,
            supplyExchangeRate: quoteRows[0].supply_exchange_rate,
            supplyMarginRate: quoteRows[0].supply_margin_rate,
            laborExchangeRate: quoteRows[0].labor_exchange_rate,
            laborMarginRate: quoteRows[0].labor_margin_rate,
            totalSuppliesHT: quoteRows[0].total_supplies_ht,
            totalLaborHT: quoteRows[0].total_labor_ht,
            totalHT: quoteRows[0].total_ht,
            tva: quoteRows[0].tva,
            totalTTC: quoteRows[0].total_ttc,
            createdAt: quoteRows[0].created_at,
            updatedAt: quoteRows[0].updated_at,
            supplyItems: supplyItems.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                priceEuro: item.price_euro,
                priceDollar: item.price_dollar,
                unitPriceDollar: item.unit_price_dollar,
                totalPriceDollar: item.total_price_dollar
            })),
            laborItems: laborItems.map(item => ({
                id: item.id,
                description: item.description,
                nbTechnicians: item.nb_technicians,
                nbHours: item.nb_hours,
                weekendMultiplier: item.weekend_multiplier,
                priceEuro: item.price_euro,
                priceDollar: item.price_dollar,
                unitPriceDollar: item.unit_price_dollar,
                totalPriceDollar: item.total_price_dollar
            }))
        };

        res.json(quote);
    } catch (error) {
        console.error('Error getting quote:', error);
        res.status(500).json({ error: 'Error getting quote' });
    }
};

// Create new quote
const createQuote = async (req, res) => {
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Create the quote
        const quoteData = {
            client_name: req.body.clientName,
            site_name: req.body.siteName,
            object: req.body.object,
            date: req.body.date,
            supply_description: req.body.supplyDescription,
            labor_description: req.body.laborDescription,
            supply_exchange_rate: req.body.supplyExchangeRate,
            supply_margin_rate: req.body.supplyMarginRate,
            labor_exchange_rate: req.body.laborExchangeRate,
            labor_margin_rate: req.body.laborMarginRate,
            total_supplies_ht: req.body.totalSuppliesHT,
            total_labor_ht: req.body.totalLaborHT,
            total_ht: req.body.totalHT,
            tva: req.body.tva,
            total_ttc: req.body.totalTTC
        };

        // Generate quote ID
        const quoteId = req.body.id || crypto.randomUUID();

        // Insert quote
        const [quoteResult] = await connection.query(
            `INSERT INTO quotes (
                id, client_name, site_name, object, date,
                supply_description, labor_description,
                supply_exchange_rate, supply_margin_rate,
                labor_exchange_rate, labor_margin_rate,
                total_supplies_ht, total_labor_ht, total_ht,
                tva, total_ttc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                quoteId,
                quoteData.client_name,
                quoteData.site_name,
                quoteData.object,
                quoteData.date,
                quoteData.supply_description,
                quoteData.labor_description,
                quoteData.supply_exchange_rate,
                quoteData.supply_margin_rate,
                quoteData.labor_exchange_rate,
                quoteData.labor_margin_rate,
                quoteData.total_supplies_ht,
                quoteData.total_labor_ht,
                quoteData.total_ht,
                quoteData.tva,
                quoteData.total_ttc
            ]
        );

        // 2. Insert supply items
        if (req.body.supplyItems && req.body.supplyItems.length > 0) {
            for (const item of req.body.supplyItems) {
                await connection.query(
                    `INSERT INTO supply_items (
                        id, quote_id, description, quantity,
                        price_euro, price_dollar, unit_price_dollar,
                        total_price_dollar
                    ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        quoteId,
                        item.description,
                        item.quantity,
                        item.priceEuro,
                        item.priceDollar,
                        item.unitPriceDollar,
                        item.totalPriceDollar
                    ]
                );
            }
        }

        // 3. Insert labor items
        if (req.body.laborItems && req.body.laborItems.length > 0) {
            for (const item of req.body.laborItems) {
                await connection.query(
                    `INSERT INTO labor_items (
                        id, quote_id, description, nb_technicians,
                        nb_hours, weekend_multiplier, price_euro,
                        price_dollar, unit_price_dollar, total_price_dollar
                    ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        quoteId,
                        item.description,
                        item.nbTechnicians,
                        item.nbHours,
                        item.weekendMultiplier,
                        item.priceEuro,
                        item.priceDollar,
                        item.unitPriceDollar,
                        item.totalPriceDollar
                    ]
                );
            }
        }

        // Commit the transaction
        await connection.commit();

        // 4. Fetch the complete quote with items
        const [quoteRows] = await connection.query('SELECT * FROM quotes WHERE id = ?', [quoteId]);
        const [supplyItems] = await connection.query('SELECT * FROM supply_items WHERE quote_id = ?', [quoteId]);
        const [laborItems] = await connection.query('SELECT * FROM labor_items WHERE quote_id = ?', [quoteId]);

        // Convert to frontend format
        const savedQuote = {
            id: quoteRows[0].id,
            clientName: quoteRows[0].client_name,
            siteName: quoteRows[0].site_name,
            object: quoteRows[0].object,
            date: quoteRows[0].date,
            supplyDescription: quoteRows[0].supply_description,
            laborDescription: quoteRows[0].labor_description,
            supplyExchangeRate: quoteRows[0].supply_exchange_rate,
            supplyMarginRate: quoteRows[0].supply_margin_rate,
            laborExchangeRate: quoteRows[0].labor_exchange_rate,
            laborMarginRate: quoteRows[0].labor_margin_rate,
            totalSuppliesHT: quoteRows[0].total_supplies_ht,
            totalLaborHT: quoteRows[0].total_labor_ht,
            totalHT: quoteRows[0].total_ht,
            tva: quoteRows[0].tva,
            totalTTC: quoteRows[0].total_ttc,
            createdAt: quoteRows[0].created_at,
            updatedAt: quoteRows[0].updated_at,
            supplyItems: supplyItems.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                priceEuro: item.price_euro,
                priceDollar: item.price_dollar,
                unitPriceDollar: item.unit_price_dollar,
                totalPriceDollar: item.total_price_dollar
            })),
            laborItems: laborItems.map(item => ({
                id: item.id,
                description: item.description,
                nbTechnicians: item.nb_technicians,
                nbHours: item.nb_hours,
                weekendMultiplier: item.weekend_multiplier,
                priceEuro: item.price_euro,
                priceDollar: item.price_dollar,
                unitPriceDollar: item.unit_price_dollar,
                totalPriceDollar: item.total_price_dollar
            }))
        };

        res.status(201).json(savedQuote);

    } catch (error) {
        // Rollback the transaction on error
        await connection.rollback();
        console.error('Error creating quote:', error);
        res.status(500).json({
            error: 'Error creating quote',
            details: error.message
        });
    } finally {
        connection.release();
    }
};

// Update quote
const updateQuote = async (req, res) => {
    const {
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
    } = req.body;

    // Validate required fields
    if (!client_name || !site_name || !date || !supply_exchange_rate || !supply_margin_rate ||
        !labor_exchange_rate || !labor_margin_rate || !total_supplies_ht || !total_labor_ht ||
        !total_ht || !tva || !total_ttc) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE quotes SET
                client_name = ?, site_name = ?, object = ?, date = ?,
                supply_description = ?, labor_description = ?,
                supply_exchange_rate = ?, supply_margin_rate = ?,
                labor_exchange_rate = ?, labor_margin_rate = ?,
                total_supplies_ht = ?, total_labor_ht = ?, total_ht = ?,
                tva = ?, total_ttc = ?
            WHERE id = ?`,
            [
                client_name, site_name, object, date, supply_description, labor_description,
                supply_exchange_rate, supply_margin_rate, labor_exchange_rate, labor_margin_rate,
                total_supplies_ht, total_labor_ht, total_ht, tva, total_ttc, req.params.id
            ]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        const [updatedQuote] = await pool.query('SELECT * FROM quotes WHERE id = ?', [req.params.id]);
        res.json(updatedQuote[0]);
    } catch (error) {
        console.error('Error updating quote:', error);
        res.status(500).json({ error: 'Error updating quote' });
    }
};

// Delete quote
const deleteQuote = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM quotes WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting quote:', error);
        res.status(500).json({ error: 'Error deleting quote' });
    }
};

module.exports = {
    getAllQuotes,
    getQuoteById,
    createQuote,
    updateQuote,
    deleteQuote
};