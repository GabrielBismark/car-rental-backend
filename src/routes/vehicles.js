const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const upload = require('../middleware/upload');

// ✅ CORRIGIDO - Verifique se o controller está sendo importado corretamente
console.log('Vehicle Controller:', vehicleController); // Debug

// ✅ CORRIGIDO - Rotas com funções explícitas
router.post('/', upload.single('image'), vehicleController.createVehicle);
router.get('/', vehicleController.getAllVehicles);
router.get('/:plate', vehicleController.getVehicle);
router.put('/:plate', upload.single('image'), vehicleController.updateVehicle);
router.delete('/:plate', vehicleController.deleteVehicle);

module.exports = router;