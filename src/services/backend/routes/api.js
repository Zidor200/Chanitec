const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

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

// Helper function for transactions
const dbTransaction = async (callback) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            callback()
                .then(() => {
                    db.run('COMMIT', (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                })
                .catch((err) => {
                    db.run('ROLLBACK', () => {
                        reject(err);
                    });
                });
        });
    });
};

// Items routes
router.get('/items', async (req, res) => {
    try {
        const items = await dbAll('SELECT * FROM items');
        // Map snake_case to camelCase
        const mappedItems = items.map(item => ({
            id: item.id,
            description: item.description,
            priceEuro: item.price_euro,
            category: item.category
        }));
        res.json(mappedItems);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/items/:category', async (req, res) => {
    try {
        const items = await dbAll('SELECT * FROM items WHERE category = ?', [req.params.category]);
        // Map snake_case to camelCase
        const mappedItems = items.map(item => ({
            id: item.id,
            description: item.description,
            priceEuro: item.price_euro,
            category: item.category
        }));
        res.json(mappedItems);
    } catch (err) {
        console.error('Error fetching items by category:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/items', async (req, res) => {
    try {
        const { description, priceEuro } = req.body;
        const id = uuidv4();
        await db.run(
            'INSERT INTO items (id, description, price_euro) VALUES (?, ?, ?)',
            [id, description, priceEuro]
        );
        res.status(201).json({ id, description, priceEuro });
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

router.put('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { description, priceEuro } = req.body;
        await db.run(
            'UPDATE items SET description = ?, price_euro = ? WHERE id = ?',
            [description, priceEuro, id]
        );
        res.status(200).json({ id, description, priceEuro });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

router.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First check if the item exists
        const item = await dbGet('SELECT * FROM items WHERE id = ?', [id]);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Delete the item within a transaction
        await dbTransaction(async () => {
            await db.run('DELETE FROM items WHERE id = ?', [id]);
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({
            error: 'Failed to delete item',
            details: error.message
        });
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
        const { name } = req.body;
        const id = uuidv4();
        await db.run(
            'INSERT INTO clients (id, name) VALUES (?, ?)',
            [id, name]
        );
        res.status(201).json({ id, name });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// Client deletion route with cascading delete
router.delete('/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First check if the client exists
        const client = await dbGet('SELECT * FROM clients WHERE id = ?', [id]);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Use a transaction to ensure all related data is deleted atomically
        await dbTransaction(async () => {
            // Delete all quotes associated with the client's sites
            const sites = await dbAll('SELECT id FROM sites WHERE client_id = ?', [id]);
            for (const site of sites) {
                await dbRun('DELETE FROM quotes WHERE site_id = ?', [site.id]);
            }

            // Delete all sites associated with the client
            await dbRun('DELETE FROM sites WHERE client_id = ?', [id]);

            // Finally, delete the client
            await dbRun('DELETE FROM clients WHERE id = ?', [id]);
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({
            error: 'Failed to delete client',
            details: error.message
        });
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
        const { name, clientId } = req.body;
        const id = uuidv4();
        await db.run(
            'INSERT INTO sites (id, name, client_id) VALUES (?, ?, ?)',
            [id, name, clientId]
        );
        res.status(201).json({ id, name, clientId });
    } catch (error) {
        console.error('Error creating site:', error);
        res.status(500).json({ error: 'Failed to create site' });
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
        const quoteData = req.body;
        const id = uuidv4();
        await db.run(
            `INSERT INTO quotes (
                id, client_name, site_name, object, date,
                supply_description, labor_description,
                supply_exchange_rate, supply_margin_rate,
                labor_exchange_rate, labor_margin_rate,
                total_supplies_ht, total_labor_ht, total_ht,
                tva, total_ttc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                quoteData.client_name,
                quoteData.site_name,
                quoteData.object,
                quoteData.date,
                quoteData.supply_description,
                quoteData.labor_description,
                quoteData.supply_exchange_rate || 1.15,
                quoteData.supply_margin_rate || 0.75,
                quoteData.labor_exchange_rate || 1.2,
                quoteData.labor_margin_rate || 0.8,
                quoteData.total_supplies_ht || 0,
                quoteData.total_labor_ht || 0,
                quoteData.total_ht || 0,
                quoteData.tva || 0,
                quoteData.total_ttc || 0
            ]
        );
        res.status(201).json({ id, ...quoteData });
    } catch (error) {
        console.error('Error creating quote:', error);
        res.status(500).json({ error: 'Failed to create quote' });
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
        const { quote_id, description, quantity, price_euro } = req.body;
        const id = uuidv4();
        await db.run(
            'INSERT INTO supply_items (id, quote_id, description, quantity, price_euro) VALUES (?, ?, ?, ?, ?)',
            [id, quote_id, description, quantity, price_euro]
        );
        res.status(201).json({ id, quote_id, description, quantity, price_euro });
    } catch (error) {
        console.error('Error creating supply item:', error);
        res.status(500).json({ error: 'Failed to create supply item' });
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
        const { quote_id, description, nb_technicians, nb_hours, weekend_multiplier, price_euro } = req.body;
        const id = uuidv4();
        await db.run(
            'INSERT INTO labor_items (id, quote_id, description, nb_technicians, nb_hours, weekend_multiplier, price_euro) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, quote_id, description, nb_technicians, nb_hours, weekend_multiplier || 1.0, price_euro]
        );
        res.status(201).json({ id, quote_id, description, nb_technicians, nb_hours, weekend_multiplier, price_euro });
    } catch (error) {
        console.error('Error creating labor item:', error);
        res.status(500).json({ error: 'Failed to create labor item' });
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

// Add this route for site deletion
router.delete('/sites/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First check if the site exists
        const site = await dbGet('SELECT * FROM sites WHERE id = ?', [id]);
        if (!site) {
            return res.status(404).json({ error: 'Site not found' });
        }

        // Use a transaction to ensure all related data is deleted atomically
        await dbTransaction(async () => {
            // Delete all quotes associated with this site
            await dbRun('DELETE FROM quotes WHERE site_id = ?', [id]);

            // Delete the site
            await dbRun('DELETE FROM sites WHERE id = ?', [id]);
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting site:', error);
        res.status(500).json({
            error: 'Failed to delete site',
            details: error.message
        });
    }
});

module.exports = router;