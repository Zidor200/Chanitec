const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debugController');

// Debug routes
router.get('/database-structure', debugController.getDatabaseStructure);
router.get('/test-site-lookup/:clientId', debugController.testSiteLookup);

module.exports = router;