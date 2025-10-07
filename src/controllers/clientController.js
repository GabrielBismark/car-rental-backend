const { clientTableClient } = require('../config/azureStorage');
const Client = require('../models/client');

exports.createClient = async (req, res) => {
  try {
    const { name, email, phone, cpf, address } = req.body;
    
    const client = new Client('client', cpf, name, email, phone, cpf, address);
    
    await clientTableClient.createEntity(client);
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const clients = [];
    const entities = clientTableClient.listEntities();
    
    for await (const entity of entities) {
      clients.push(entity);
    }
    
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClient = async (req, res) => {
  try {
    const client = await clientTableClient.getEntity('client', req.params.cpf);
    res.json(client);
  } catch (error) {
    res.status(404).json({ error: 'Cliente não encontrado' });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const cpf = req.params.cpf;

    let client;
    try {
      client = await clientTableClient.getEntity('client', cpf);
    } catch {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const updatedClient = {
      ...client,
      name: name || client.name,
      email: email || client.email,
      phone: phone || client.phone,
      address: address || client.address
    };

    await clientTableClient.updateEntity(updatedClient, 'Replace');
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    await clientTableClient.deleteEntity('client', req.params.cpf);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};