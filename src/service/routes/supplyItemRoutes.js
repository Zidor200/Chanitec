const express = require('express');
const router = express.Router();
const supplyItemController = require('../controllers/supplyItemController');

// Get all supply items for a quote
router.get('/:quoteId', supplyItemController.getSupplyItemsByQuoteId);

// Get supply item by ID
router.get('/item/:id', supplyItemController.getSupplyItemById);

// Create new supply item
router.post('/:quoteId', supplyItemController.createSupplyItem);

// Update supply item
router.put('/:id', supplyItemController.updateSupplyItem);

// Delete supply item
router.delete('/:id', supplyItemController.deleteSupplyItem);

module.exports = router;