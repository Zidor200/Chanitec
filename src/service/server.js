const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: '0210',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'chanitec'
};

console.log('Starting server with configuration:', {
    port: port,
    dbHost: dbConfig.host,
    dbUser: dbConfig.user,
    dbPort: dbConfig.port,
    dbName: dbConfig.database
});

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'API is working' });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.ping();
        await connection.end();
        res.json({ status: 'ok', message: 'Database connection successful' });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Import routes
try {
    const clientRoutes = require('./routes/clientRoutes');
    const siteRoutes = require('./routes/siteRoutes');
    const quoteRoutes = require('./routes/quoteRoutes');
    const supplyItemRoutes = require('./routes/supplyItemRoutes');
    const laborItemRoutes = require('./routes/laborItemRoutes');
    const itemRoutes = require('./routes/itemRoutes');
    const debugRoutes = require('./routes/debugRoutes');

    app.use('/api/clients', clientRoutes);
    app.use('/api/sites', siteRoutes);
    app.use('/api/quotes', quoteRoutes);
    app.use('/api/supply-items', supplyItemRoutes);
    app.use('/api/labor-items', laborItemRoutes);
    app.use('/api/items', itemRoutes);
    app.use('/api/debug', debugRoutes);
} catch (error) {
    console.error('Error loading routes:', error.stack);
    throw error;
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Something broke!',
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}).on('error', (error) => {
    console.error('Error starting server:', error);
});

// Handle server shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});