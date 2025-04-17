const pool = require('../../database/pool');

// Get all clients
const getAllClients = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clients');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Error fetching clients' });
    }
};

// Get client by ID
const getClientById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Error fetching client' });
    }
};

// Create new client
const createClient = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO clients (id, name) VALUES (UUID(), ?)',
            [name]
        );

        // Get the newly created client using UUID() generated
        const [rows] = await pool.query(
            'SELECT * FROM clients WHERE name = ? ORDER BY created_at DESC LIMIT 1',
            [name]
        );

        if (rows.length === 0) {
            throw new Error('Failed to retrieve newly created client');
        }

        // Return complete client object
        const newClient = {
            id: rows[0].id,
            name: rows[0].name,
            created_at: rows[0].created_at,
            updated_at: rows[0].updated_at
        };

        res.status(201).json(newClient);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({
            error: 'Error creating client',
            details: error.message
        });
    }
};

// Update client
const updateClient = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE clients SET name = ? WHERE id = ?',
            [name, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        const [updatedClient] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        res.json(updatedClient[0]);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Error updating client' });
    }
};

// Delete client
const deleteClient = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Error deleting client' });
    }
};

module.exports = {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient
};