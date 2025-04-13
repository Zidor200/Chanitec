const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Get the path to the database file
const dbPath = path.join(__dirname, 'database.db');

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        createTables();
    }
});

// Function to create all necessary tables
function createTables() {
    db.serialize(() => {
        // Items table (for supply items catalog)
        db.run(`CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            price_euro REAL NOT NULL,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Clients table
        db.run(`CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Sites table
        db.run(`CREATE TABLE IF NOT EXISTS sites (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            client_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
            UNIQUE(name)
        )`);

        // Quotes table
        db.run(`CREATE TABLE IF NOT EXISTS quotes (
            id TEXT PRIMARY KEY,
            client_name TEXT NOT NULL,
            site_name TEXT NOT NULL,
            object TEXT NOT NULL,
            date TEXT NOT NULL,
            supply_description TEXT,
            labor_description TEXT,
            supply_exchange_rate REAL NOT NULL DEFAULT 1.15,
            supply_margin_rate REAL NOT NULL DEFAULT 0.75,
            labor_exchange_rate REAL NOT NULL DEFAULT 1.2,
            labor_margin_rate REAL NOT NULL DEFAULT 0.8,
            total_supplies_ht REAL NOT NULL DEFAULT 0,
            total_labor_ht REAL NOT NULL DEFAULT 0,
            total_ht REAL NOT NULL DEFAULT 0,
            tva REAL NOT NULL DEFAULT 0,
            total_ttc REAL NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Supply Items table
        db.run(`CREATE TABLE IF NOT EXISTS supply_items (
            id TEXT PRIMARY KEY,
            quote_id TEXT NOT NULL,
            description TEXT NOT NULL,
            quantity REAL NOT NULL,
            price_euro REAL NOT NULL,
            price_dollar REAL,
            unit_price_dollar REAL,
            total_price_dollar REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
        )`);

        // Labor Items table
        db.run(`CREATE TABLE IF NOT EXISTS labor_items (
            id TEXT PRIMARY KEY,
            quote_id TEXT NOT NULL,
            description TEXT NOT NULL,
            nb_technicians INTEGER NOT NULL,
            nb_hours REAL NOT NULL,
            weekend_multiplier REAL NOT NULL DEFAULT 1.0,
            price_euro REAL NOT NULL,
            price_dollar REAL,
            unit_price_dollar REAL,
            total_price_dollar REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
        )`);

        // Price Offers table
        db.run(`CREATE TABLE IF NOT EXISTS price_offers (
            id TEXT PRIMARY KEY,
            quote_id TEXT NOT NULL,
            client_name TEXT NOT NULL,
            site_name TEXT NOT NULL,
            object TEXT NOT NULL,
            date TEXT NOT NULL,
            supply_description TEXT,
            supply_total_ht REAL NOT NULL,
            labor_description TEXT,
            labor_total_ht REAL NOT NULL,
            total_ht REAL NOT NULL,
            tva REAL NOT NULL,
            total_ttc REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
        )`);

        // Create indexes
        db.run('CREATE INDEX IF NOT EXISTS idx_quotes_client_name ON quotes(client_name)');
        db.run('CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date)');
        db.run('CREATE INDEX IF NOT EXISTS idx_supply_items_quote_id ON supply_items(quote_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_labor_items_quote_id ON labor_items(quote_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_sites_client_id ON sites(client_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_price_offers_quote_id ON price_offers(quote_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)');
    });
}

// Export the database connection
module.exports = db;