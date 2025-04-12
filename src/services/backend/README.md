# Facteur Backend

A lightweight SQLite-based backend for the Facteur quote management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Start the production server:
```bash
npm start
```

## API Endpoints

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create a new client

### Sites
- `GET /api/sites` - Get all sites
- `POST /api/sites` - Create a new site

### Quotes
- `GET /api/quotes` - Get all quotes
- `GET /api/quotes/:id` - Get a specific quote
- `POST /api/quotes` - Create a new quote

### Supply Items
- `GET /api/supply-items/:quoteId` - Get supply items for a quote
- `POST /api/supply-items` - Create a new supply item

### Labor Items
- `GET /api/labor-items/:quoteId` - Get labor items for a quote
- `POST /api/labor-items` - Create a new labor item

### Price Offers
- `GET /api/price-offers` - Get all price offers
- `POST /api/price-offers` - Create a new price offer

## Deployment

This backend is configured for deployment on Render.com:

1. Create a new Web Service on Render
2. Connect your repository
3. Set the following environment variables:
   - `PORT`: The port number (default: 3001)
   - `FRONTEND_URL`: Your frontend URL (e.g., https://your-app.vercel.app)
4. Set the build command: `npm install`
5. Set the start command: `npm start`

## Development

- The server runs on port 3001 by default
- CORS is configured to allow requests from `http://localhost:3000` in development
- The SQLite database file is stored in `db/database.db`
- All database tables are created automatically on first run