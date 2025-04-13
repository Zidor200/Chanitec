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
            // Get all sites for this client
            const sites = await dbAll('SELECT name FROM sites WHERE client_id = ?', [id]);

            // Delete all quotes associated with the client's sites
            for (const site of sites) {
                await dbRun('DELETE FROM quotes WHERE site_name = ?', [site.name]);
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
        const { clientId } = req.query;
        let query = 'SELECT * FROM sites';
        let params = [];

        if (clientId) {
            query += ' WHERE client_id = ?';
            params.push(clientId);
        }

        const sites = await dbAll(query, params);
        res.json(sites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/sites', async (req, res) => {
    try {
        const { name, clientId } = req.body;

        // Check if site name already exists
        const existingSite = await dbGet('SELECT * FROM sites WHERE name = ?', [name]);
        if (existingSite) {
            return res.status(400).json({
                error: 'Un site avec ce nom existe déjà. Chaque site doit avoir un nom unique.'
            });
        }

        // Check if client exists
        const client = await dbGet('SELECT * FROM clients WHERE id = ?', [clientId]);
        if (!client) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }

        const id = uuidv4();
        await dbRun(
            'INSERT INTO sites (id, name, client_id) VALUES (?, ?, ?)',
            [id, name, clientId]
        );

        const newSite = {
            id,
            name,
            clientId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        res.status(201).json(newSite);
    } catch (error) {
        console.error('Error creating site:', error);
        res.status(500).json({
            error: 'Échec de la création du site',
            details: error.message
        });
    }
});

// Update site endpoint
router.put('/sites/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, clientId } = req.body;

        // Check if site exists
        const existingSite = await dbGet('SELECT * FROM sites WHERE id = ?', [id]);
        if (!existingSite) {
            return res.status(404).json({ error: 'Site non trouvé' });
        }

        // Check if new name is already used by another site
        const nameConflict = await dbGet(
            'SELECT * FROM sites WHERE name = ? AND id != ?',
            [name, id]
        );
        if (nameConflict) {
            return res.status(400).json({
                error: 'Un site avec ce nom existe déjà. Chaque site doit avoir un nom unique.'
            });
        }

        // Check if client exists
        const client = await dbGet('SELECT * FROM clients WHERE id = ?', [clientId]);
        if (!client) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }

        await dbRun(
            'UPDATE sites SET name = ?, client_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, clientId, id]
        );

        const updatedSite = {
            id,
            name,
            clientId,
            updatedAt: new Date().toISOString()
        };

        res.json(updatedSite);
    } catch (error) {
        console.error('Error updating site:', error);
        res.status(500).json({
            error: 'Échec de la mise à jour du site',
            details: error.message
        });
    }
});

// Quotes routes
router.get('/quotes', async (req, res) => {
    try {
        const quotes = await dbAll('SELECT * FROM quotes');
        // Map snake_case to camelCase
        const mappedQuotes = quotes.map(quote => ({
            id: quote.id,
            clientName: quote.client_name,
            siteName: quote.site_name,
            object: quote.object,
            date: quote.date,
            supplyDescription: quote.supply_description,
            laborDescription: quote.labor_description,
            supplyExchangeRate: quote.supply_exchange_rate,
            supplyMarginRate: quote.supply_margin_rate,
            laborExchangeRate: quote.labor_exchange_rate,
            laborMarginRate: quote.labor_margin_rate,
            totalSuppliesHT: quote.total_supplies_ht,
            totalLaborHT: quote.total_labor_ht,
            totalHT: quote.total_ht,
            tva: quote.tva,
            totalTTC: quote.total_ttc,
            createdAt: quote.created_at,
            updatedAt: quote.updated_at
        }));
        res.json(mappedQuotes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/quotes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const quote = await dbGet('SELECT * FROM quotes WHERE id = ?', [id]);

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        // Get supply items
        const supplyItems = await dbAll('SELECT * FROM supply_items WHERE quote_id = ?', [id]);

        // Get labor items
        const laborItems = await dbAll('SELECT * FROM labor_items WHERE quote_id = ?', [id]);

        // Map the response to camelCase
        const response = {
            id: quote.id,
            clientName: quote.client_name,
            siteName: quote.site_name,
            object: quote.object,
            date: quote.date,
            supplyDescription: quote.supply_description,
            laborDescription: quote.labor_description,
            supplyExchangeRate: quote.supply_exchange_rate,
            supplyMarginRate: quote.supply_margin_rate,
            laborExchangeRate: quote.labor_exchange_rate,
            laborMarginRate: quote.labor_margin_rate,
            totalSuppliesHT: quote.total_supplies_ht,
            totalLaborHT: quote.total_labor_ht,
            totalHT: quote.total_ht,
            tva: quote.tva,
            totalTTC: quote.total_ttc,
            supplyItems: supplyItems.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                priceEuro: item.price_euro
            })),
            laborItems: laborItems.map(item => ({
                id: item.id,
                description: item.description,
                nbTechnicians: item.nb_technicians,
                nbHours: item.nb_hours,
                weekendMultiplier: item.weekend_multiplier,
                priceEuro: item.price_euro
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).json({
            error: 'Failed to fetch quote',
            details: error.message
        });
    }
});

router.post('/quotes', async (req, res) => {
    try {
        const quoteData = req.body;
        const id = quoteData.id;

        // Check if this is a new version of an existing quote
        const existingQuote = await dbGet('SELECT * FROM quotes WHERE id = ?', [id]);
        if (existingQuote) {
            // This is an update to an existing quote, create a new version
            const baseId = id.match(/^F-(\d{8})-\d{3}$/)?.[1];
            const currentVersion = parseInt(id.match(/^F-\d{8}-(\d{3})$/)?.[1] || '0', 10);
            const newVersion = currentVersion + 1;
            const newId = `F-${baseId}-${newVersion.toString().padStart(3, '0')}`;

            // Map camelCase to snake_case if needed
            const mappedData = {
                client_name: quoteData.clientName || quoteData.client_name,
                site_name: quoteData.siteName || quoteData.site_name,
                object: quoteData.object,
                date: quoteData.date,
                supply_description: quoteData.supplyDescription || quoteData.supply_description,
                labor_description: quoteData.laborDescription || quoteData.labor_description,
                supply_exchange_rate: quoteData.supplyExchangeRate || quoteData.supply_exchange_rate || 1.15,
                supply_margin_rate: quoteData.supplyMarginRate || quoteData.supply_margin_rate || 0.75,
                labor_exchange_rate: quoteData.laborExchangeRate || quoteData.labor_exchange_rate || 1.2,
                labor_margin_rate: quoteData.laborMarginRate || quoteData.labor_margin_rate || 0.8,
                total_supplies_ht: quoteData.totalSuppliesHT || quoteData.total_supplies_ht || 0,
                total_labor_ht: quoteData.totalLaborHT || quoteData.total_labor_ht || 0,
                total_ht: quoteData.totalHT || quoteData.total_ht || 0,
                tva: quoteData.tva || 0,
                total_ttc: quoteData.totalTTC || quoteData.total_ttc || 0
            };

            // Use a transaction to ensure all data is saved atomically
            await dbTransaction(async () => {
                // Save the new version of the quote
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
                        newId,
                        mappedData.client_name,
                        mappedData.site_name,
                        mappedData.object,
                        mappedData.date,
                        mappedData.supply_description,
                        mappedData.labor_description,
                        mappedData.supply_exchange_rate,
                        mappedData.supply_margin_rate,
                        mappedData.labor_exchange_rate,
                        mappedData.labor_margin_rate,
                        mappedData.total_supplies_ht,
                        mappedData.total_labor_ht,
                        mappedData.total_ht,
                        mappedData.tva,
                        mappedData.total_ttc
                    ]
                );

                // Save supply items for the new version
                if (quoteData.supplyItems && quoteData.supplyItems.length > 0) {
                    for (const item of quoteData.supplyItems) {
                        await db.run(
                            'INSERT INTO supply_items (id, quote_id, description, quantity, price_euro) VALUES (?, ?, ?, ?, ?)',
                            [uuidv4(), newId, item.description, item.quantity, item.priceEuro]
                        );
                    }
                }

                // Save labor items for the new version
                if (quoteData.laborItems && quoteData.laborItems.length > 0) {
                    for (const item of quoteData.laborItems) {
                        await db.run(
                            'INSERT INTO labor_items (id, quote_id, description, nb_technicians, nb_hours, weekend_multiplier, price_euro) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [uuidv4(), newId, item.description, item.nbTechnicians, item.nbHours, item.weekendMultiplier || 1.0, item.priceEuro]
                        );
                    }
                }
            });

            // Get the saved quote with its items
            const savedQuote = await dbGet('SELECT * FROM quotes WHERE id = ?', [newId]);
            const supplyItems = await dbAll('SELECT * FROM supply_items WHERE quote_id = ?', [newId]);
            const laborItems = await dbAll('SELECT * FROM labor_items WHERE quote_id = ?', [newId]);

            // Map the response to camelCase
            const response = {
                id: savedQuote.id,
                clientName: savedQuote.client_name,
                siteName: savedQuote.site_name,
                object: savedQuote.object,
                date: savedQuote.date,
                supplyDescription: savedQuote.supply_description,
                laborDescription: savedQuote.labor_description,
                supplyExchangeRate: savedQuote.supply_exchange_rate,
                supplyMarginRate: savedQuote.supply_margin_rate,
                laborExchangeRate: savedQuote.labor_exchange_rate,
                laborMarginRate: savedQuote.labor_margin_rate,
                totalSuppliesHT: savedQuote.total_supplies_ht,
                totalLaborHT: savedQuote.total_labor_ht,
                totalHT: savedQuote.total_ht,
                tva: savedQuote.tva,
                totalTTC: savedQuote.total_ttc,
                supplyItems: supplyItems.map(item => ({
                    id: item.id,
                    description: item.description,
                    quantity: item.quantity,
                    priceEuro: item.price_euro
                })),
                laborItems: laborItems.map(item => ({
                    id: item.id,
                    description: item.description,
                    nbTechnicians: item.nb_technicians,
                    nbHours: item.nb_hours,
                    weekendMultiplier: item.weekend_multiplier,
                    priceEuro: item.price_euro
                }))
            };

            res.status(201).json(response);
        } else {
            // This is a new quote, proceed with normal save
            // Map camelCase to snake_case if needed
            const mappedData = {
                client_name: quoteData.clientName || quoteData.client_name,
                site_name: quoteData.siteName || quoteData.site_name,
                object: quoteData.object,
                date: quoteData.date,
                supply_description: quoteData.supplyDescription || quoteData.supply_description,
                labor_description: quoteData.laborDescription || quoteData.labor_description,
                supply_exchange_rate: quoteData.supplyExchangeRate || quoteData.supply_exchange_rate || 1.15,
                supply_margin_rate: quoteData.supplyMarginRate || quoteData.supply_margin_rate || 0.75,
                labor_exchange_rate: quoteData.laborExchangeRate || quoteData.labor_exchange_rate || 1.2,
                labor_margin_rate: quoteData.laborMarginRate || quoteData.labor_margin_rate || 0.8,
                total_supplies_ht: quoteData.totalSuppliesHT || quoteData.total_supplies_ht || 0,
                total_labor_ht: quoteData.totalLaborHT || quoteData.total_labor_ht || 0,
                total_ht: quoteData.totalHT || quoteData.total_ht || 0,
                tva: quoteData.tva || 0,
                total_ttc: quoteData.totalTTC || quoteData.total_ttc || 0
            };

            // Use a transaction to ensure all data is saved atomically
            await dbTransaction(async () => {
                // Save the quote
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
                        mappedData.client_name,
                        mappedData.site_name,
                        mappedData.object,
                        mappedData.date,
                        mappedData.supply_description,
                        mappedData.labor_description,
                        mappedData.supply_exchange_rate,
                        mappedData.supply_margin_rate,
                        mappedData.labor_exchange_rate,
                        mappedData.labor_margin_rate,
                        mappedData.total_supplies_ht,
                        mappedData.total_labor_ht,
                        mappedData.total_ht,
                        mappedData.tva,
                        mappedData.total_ttc
                    ]
                );

                // Save supply items
                if (quoteData.supplyItems && quoteData.supplyItems.length > 0) {
                    for (const item of quoteData.supplyItems) {
                        await db.run(
                            'INSERT INTO supply_items (id, quote_id, description, quantity, price_euro) VALUES (?, ?, ?, ?, ?)',
                            [uuidv4(), id, item.description, item.quantity, item.priceEuro]
                        );
                    }
                }

                // Save labor items
                if (quoteData.laborItems && quoteData.laborItems.length > 0) {
                    for (const item of quoteData.laborItems) {
                        await db.run(
                            'INSERT INTO labor_items (id, quote_id, description, nb_technicians, nb_hours, weekend_multiplier, price_euro) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [uuidv4(), id, item.description, item.nbTechnicians, item.nbHours, item.weekendMultiplier || 1.0, item.priceEuro]
                        );
                    }
                }
            });

            // Get the saved quote with its items
            const savedQuote = await dbGet('SELECT * FROM quotes WHERE id = ?', [id]);
            const supplyItems = await dbAll('SELECT * FROM supply_items WHERE quote_id = ?', [id]);
            const laborItems = await dbAll('SELECT * FROM labor_items WHERE quote_id = ?', [id]);

            // Map the response to camelCase
            const response = {
                id: savedQuote.id,
                clientName: savedQuote.client_name,
                siteName: savedQuote.site_name,
                object: savedQuote.object,
                date: savedQuote.date,
                supplyDescription: savedQuote.supply_description,
                laborDescription: savedQuote.labor_description,
                supplyExchangeRate: savedQuote.supply_exchange_rate,
                supplyMarginRate: savedQuote.supply_margin_rate,
                laborExchangeRate: savedQuote.labor_exchange_rate,
                laborMarginRate: savedQuote.labor_margin_rate,
                totalSuppliesHT: savedQuote.total_supplies_ht,
                totalLaborHT: savedQuote.total_labor_ht,
                totalHT: savedQuote.total_ht,
                tva: savedQuote.tva,
                totalTTC: savedQuote.total_ttc,
                supplyItems: supplyItems.map(item => ({
                    id: item.id,
                    description: item.description,
                    quantity: item.quantity,
                    priceEuro: item.price_euro
                })),
                laborItems: laborItems.map(item => ({
                    id: item.id,
                    description: item.description,
                    nbTechnicians: item.nb_technicians,
                    nbHours: item.nb_hours,
                    weekendMultiplier: item.weekend_multiplier,
                    priceEuro: item.price_euro
                }))
            };

            res.status(201).json(response);
        }
    } catch (error) {
        console.error('Error creating quote:', error);
        res.status(500).json({
            error: 'Failed to create quote',
            details: error.message
        });
    }
});

// Supply Items routes
router.get('/supply-items/:quoteId', async (req, res) => {
    try {
        const items = await dbAll('SELECT * FROM supply_items WHERE quote_id = ?', [req.params.quoteId]);
        // Map snake_case to camelCase
        const mappedItems = items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            priceEuro: item.price_euro
        }));
        res.json(mappedItems);
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
        // Map snake_case to camelCase
        const mappedItems = items.map(item => ({
            id: item.id,
            description: item.description,
            nbTechnicians: item.nb_technicians,
            nbHours: item.nb_hours,
            weekendMultiplier: item.weekend_multiplier,
            priceEuro: item.price_euro
        }));
        res.json(mappedItems);
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

// Add quote deletion route
router.delete('/quotes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First check if the quote exists
        const quote = await dbGet('SELECT * FROM quotes WHERE id = ?', [id]);
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        // Use a transaction to ensure all related data is deleted atomically
        await dbTransaction(async () => {
            // Delete all supply items associated with this quote
            await dbRun('DELETE FROM supply_items WHERE quote_id = ?', [id]);

            // Delete all labor items associated with this quote
            await dbRun('DELETE FROM labor_items WHERE quote_id = ?', [id]);

            // Delete the quote
            await dbRun('DELETE FROM quotes WHERE id = ?', [id]);
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting quote:', error);
        res.status(500).json({
            error: 'Failed to delete quote',
            details: error.message
        });
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
            // Delete all quotes associated with this site using site_name
            await dbRun('DELETE FROM quotes WHERE site_name = ?', [site.name]);

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