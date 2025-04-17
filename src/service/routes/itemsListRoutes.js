const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const itemsListController = require('../controllers/itemsListController');

// Basic CRUD routes
router.get('/', itemsListController.getAllItems);
router.get('/:id', itemsListController.getItemById);
router.post('/', itemsListController.createItem);
router.put('/:id', itemsListController.updateItem);
router.delete('/:id', itemsListController.deleteItem);

// Excel import route
router.post('/import', upload.single('file'), itemsListController.importItems);

module.exports = router;