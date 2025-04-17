const pool = require('../../database/pool');

// Get database tables and structure information
const getDatabaseStructure = async (req, res) => {
    try {
        console.log('Getting database structure information');

        // Get tables list
        const [tables] = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
        `);

        const tableNames = tables.map(t => t.table_name);
        console.log('Tables found:', tableNames);

        // Get structure for each table
        const tableStructures = {};
        for (const tableName of tableNames) {
            const [columns] = await pool.query(`
                SELECT column_name, column_type, is_nullable, column_key, column_default
                FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = ?
                ORDER BY ordinal_position
            `, [tableName]);

            tableStructures[tableName] = columns;

            // Also get a few sample rows from each table
            try {
                const [samples] = await pool.query(`SELECT * FROM ${tableName} LIMIT 3`);
                tableStructures[tableName + '_samples'] = samples;
            } catch (error) {
                console.error(`Error getting samples for table ${tableName}:`, error);
                tableStructures[tableName + '_samples'] = { error: error.message };
            }
        }

        // Get foreign key relationships
        const [relationships] = await pool.query(`
            SELECT
                table_name,
                column_name,
                referenced_table_name,
                referenced_column_name
            FROM information_schema.key_column_usage
            WHERE referenced_table_name IS NOT NULL
            AND table_schema = DATABASE()
            ORDER BY table_name, column_name
        `);

        res.json({
            tables: tableNames,
            structures: tableStructures,
            relationships: relationships
        });
    } catch (error) {
        console.error('Error getting database structure:', error);
        res.status(500).json({ error: 'Error getting database structure' });
    }
};

// Test site lookup for a specific client
const testSiteLookup = async (req, res) => {
    const clientId = req.params.clientId;

    if (!clientId) {
        return res.status(400).json({ error: 'Client ID is required' });
    }

    try {
        // Check if client exists
        const [client] = await pool.query('SELECT * FROM clients WHERE id = ?', [clientId]);

        if (client.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Get all sites for direct comparison
        const [allSites] = await pool.query('SELECT * FROM sites');

        // Get sites for the client
        const [clientSites] = await pool.query('SELECT * FROM sites WHERE client_id = ?', [clientId]);

        res.json({
            client: client[0],
            clientSites: clientSites,
            allSitesCount: allSites.length,
            matchingSitesCount: clientSites.length,
            // For debugging, show some sites and their client_id
            sampleSites: allSites.slice(0, 5).map(site => ({
                id: site.id,
                name: site.name,
                client_id: site.client_id,
                matches: site.client_id === clientId
            }))
        });
    } catch (error) {
        console.error('Error testing site lookup:', error);
        res.status(500).json({ error: 'Error testing site lookup' });
    }
};

module.exports = {
    getDatabaseStructure,
    testSiteLookup
};