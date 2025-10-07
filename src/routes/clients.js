const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.post('/', clientController.createClient);
router.get('/', clientController.getAllClients);
router.get('/:cpf', clientController.getClient);
router.put('/:cpf', clientController.updateClient);
router.delete('/:cpf', clientController.deleteClient);

module.exports = router;