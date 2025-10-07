const { rentalTableClient, vehicleTableClient, clientTableClient } = require('../config/azureStorage');
const { v4: uuidv4 } = require('uuid');
const Rental = require('../models/rental');

exports.createRental = async (req, res) => {
  try {
    const { vehiclePlate, clientCpf, startDate, endDate, totalPrice } = req.body;
    
    // Verificar se veículo existe
    let vehicle;
    try {
      vehicle = await vehicleTableClient.getEntity('vehicle', vehiclePlate);
    } catch {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Verificar se cliente existe
    try {
      await clientTableClient.getEntity('client', clientCpf);
    } catch {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const rentalId = uuidv4();
    const rental = new Rental('rental', rentalId, vehiclePlate, clientCpf, startDate, endDate, parseFloat(totalPrice));
    
    await rentalTableClient.createEntity(rental);
    
    // Marcar veículo como indisponível
    vehicle.available = false;
    await vehicleTableClient.updateEntity(vehicle, 'Replace');
    
    res.status(201).json(rental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllRentals = async (req, res) => {
  try {
    const rentals = [];
    const entities = rentalTableClient.listEntities();
    
    for await (const entity of entities) {
      rentals.push(entity);
    }
    
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClientRentals = async (req, res) => {
  try {
    const rentals = [];
    const entities = rentalTableClient.listEntities();
    
    for await (const entity of entities) {
      if (entity.clientId === req.params.clientCpf) {
        rentals.push(entity);
      }
    }
    
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRentalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const rentalId = req.params.id;

    let rental;
    try {
      rental = await rentalTableClient.getEntity('rental', rentalId);
    } catch {
      return res.status(404).json({ error: 'Locação não encontrada' });
    }

    rental.status = status;
    await rentalTableClient.updateEntity(rental, 'Replace');

    // Se a locação foi finalizada ou cancelada, marcar veículo como disponível
    if (status === 'completed' || status === 'cancelled') {
      try {
        const vehicle = await vehicleTableClient.getEntity('vehicle', rental.vehicleId);
        vehicle.available = true;
        await vehicleTableClient.updateEntity(vehicle, 'Replace');
      } catch (error) {
        console.error('Erro ao atualizar disponibilidade do veículo:', error);
      }
    }

    res.json(rental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};