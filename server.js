const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.'));

// Get items
app.get('/api/items', async (req, res) => {
    try {
        const data = await fs.readFile('items.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Error reading items' });
    }
});

// Save items
app.post('/api/items', async (req, res) => {
    try {
        const items = req.body;
        await fs.writeFile('items.json', JSON.stringify({ items }, null, 4));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error saving items' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});