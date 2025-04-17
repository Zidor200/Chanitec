const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const itemController = require('../controllers/itemController');

   // Fixed routes first
   router.get('/', itemController.getAllItems);
   router.post('/', itemController.createItem);
   router.post('/import', upload.single('file'), itemController.importItems);
   router.delete('/clear', itemController.clearItems);  // Move this before /:id routes

   // Parameterized routes last
   router.get('/:id', itemController.getItemById);
   router.put('/:id', itemController.updateItem);
   router.delete('/:id', itemController.deleteItem);

module.exports = router;