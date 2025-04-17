const express = require('express');
const router = express.Router();
const laborItemController = require('../controllers/laborItemController');

// Get all labor items for a quote
router.get('/:quoteId', laborItemController.getLaborItemsByQuoteId);

// Get labor item by ID
router.get('/item/:id', laborItemController.getLaborItemById);

// Create new labor item
router.post('/:quoteId', laborItemController.createLaborItem);

// Update labor item
router.put('/:id', laborItemController.updateLaborItem);

// Delete labor item
router.delete('/:id', laborItemController.deleteLaborItem);

module.exports = router;