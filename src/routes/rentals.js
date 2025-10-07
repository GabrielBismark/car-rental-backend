const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');

router.post('/', rentalController.createRental);
router.get('/', rentalController.getAllRentals);
router.get('/client/:clientCpf', rentalController.getClientRentals);
router.patch('/:id/status', rentalController.updateRentalStatus);

module.exports = router;