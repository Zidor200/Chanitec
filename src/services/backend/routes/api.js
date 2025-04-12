const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Helper function to promisify db operations
const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

// Items routes
router.get('/items', async (req, res) => {
    try {
        const items = await dbAll('SELECT * FROM items');
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/items/:category', async (req, res) => {
    try {
        const items = await dbAll('SELECT * FROM items WHERE category = ?', [req.params.category]);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/items', async (req, res) => {
    try {
        const { id, description, price_euro, category } = req.body;
        await dbRun('INSERT INTO items (id, description, price_euro, category) VALUES (?, ?, ?, ?)',
            [id, description, price_euro, category]);
        res.status(201).json({ id, description, price_euro, category });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clients routes
router.get('/clients', async (req, res) => {
    try {
        const clients = await dbAll('SELECT * FROM clients');
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/clients', async (req, res) => {
    try {
        const { id, name } = req.body;
        await dbRun('INSERT INTO clients (id, name) VALUES (?, ?)', [id, name]);
        res.status(201).json({ id, name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sites routes
router.get('/sites', async (req, res) => {
    try {
        const sites = await dbAll('SELECT * FROM sites');
        res.json(sites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/sites', async (req, res) => {
    try {
        const { id, name, clientId } = req.body;
        await dbRun('INSERT INTO sites (id, name, client_id) VALUES (?, ?, ?)', [id, name, clientId]);
        res.status(201).json({ id, name, clientId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Quotes routes
router.get('/quotes', async (req, res) => {
    try {
        const quotes = await dbAll('SELECT * FROM quotes');
        res.json(quotes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/quotes/:id', async (req, res) => {
    try {
        const quote = await dbGet('SELECT * FROM quotes WHERE id = ?', [req.params.id]);
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        res.json(quote);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/quotes', async (req, res) => {
    try {
        const quote = req.body;
        const fields = Object.keys(quote).join(', ');
        const values = Object.values(quote);
        const placeholders = values.map(() => '?').join(', ');

        await dbRun(`INSERT INTO quotes (${fields}) VALUES (${placeholders})`, values);
        res.status(201).json(quote);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Supply Items routes
router.get('/supply-items/:quoteId', async (req, res) => {
    try {
        const items = await dbAll('SELECT * FROM supply_items WHERE quote_id = ?', [req.params.quoteId]);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/supply-items', async (req, res) => {
    try {
        const item = req.body;
        const fields = Object.keys(item).join(', ');
        const values = Object.values(item);
        const placeholders = values.map(() => '?').join(', ');

        await dbRun(`INSERT INTO supply_items (${fields}) VALUES (${placeholders})`, values);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Labor Items routes
router.get('/labor-items/:quoteId', async (req, res) => {
    try {
        const items = await dbAll('SELECT * FROM labor_items WHERE quote_id = ?', [req.params.quoteId]);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/labor-items', async (req, res) => {
    try {
        const item = req.body;
        const fields = Object.keys(item).join(', ');
        const values = Object.values(item);
        const placeholders = values.map(() => '?').join(', ');

        await dbRun(`INSERT INTO labor_items (${fields}) VALUES (${placeholders})`, values);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Price Offers routes
router.get('/price-offers', async (req, res) => {
    try {
        const offers = await dbAll('SELECT * FROM price_offers');
        res.json(offers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/price-offers', async (req, res) => {
    try {
        const offer = req.body;
        const fields = Object.keys(offer).join(', ');
        const values = Object.values(offer);
        const placeholders = values.map(() => '?').join(', ');

        await dbRun(`INSERT INTO price_offers (${fields}) VALUES (${placeholders})`, values);
        res.status(201).json(offer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;