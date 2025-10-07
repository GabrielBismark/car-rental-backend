const { vehicleTableClient, containerClient } = require('../config/azureStorage');
const { v4: uuidv4 } = require('uuid');
const Vehicle = require('../models/vehicle');

// ✅ CORRIGIDO - Função de upload com verificação
async function uploadImageToBlob(file, plate) {
  try {
    console.log('📤 Iniciando upload da imagem...');
    console.log('📁 Container Client:', containerClient ? 'Definido' : 'UNDEFINED');
    
    if (!containerClient) {
      throw new Error('Container client não está definido');
    }

    if (!file || !file.buffer) {
      throw new Error('Arquivo inválido para upload');
    }

    // Gerar nome único para o blob
    const fileExtension = file.originalname.split('.').pop() || 'png';
    const blobName = `vehicle-${plate}-${uuidv4()}.${fileExtension}`;
    
    console.log('📝 Nome do blob:', blobName);
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    console.log('⬆️ Fazendo upload para Azure Blob Storage...');
    
    // Fazer o upload
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { 
        blobContentType: file.mimetype,
        blobContentDisposition: `inline; filename="${file.originalname}"`
      }
    });
    
    console.log('✅ Upload concluído com sucesso');
    console.log('🔗 URL da imagem:', blockBlobClient.url);
    
    return blockBlobClient.url;
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw new Error(`Erro no upload da imagem: ${error.message}`);
  }
}

// ✅ CORRIGIDO - Create Vehicle
const createVehicle = async (req, res) => {
  try {
    console.log('🚗 Iniciando criação de veículo...');
    console.log('📦 Body:', req.body);
    console.log('🖼️ File:', req.file ? `Arquivo recebido: ${req.file.originalname}` : 'Nenhum arquivo');
    
    const { brand, model, year, plate, dailyPrice } = req.body;
    
    // Validação dos campos obrigatórios
    if (!brand || !model || !year || !plate || !dailyPrice) {
      return res.status(400).json({ 
        error: 'Todos os campos são obrigatórios: marca, modelo, ano, placa, preço diário' 
      });
    }

    let imageUrl = '';
    
    // Upload da imagem se existir
    if (req.file) {
      try {
        imageUrl = await uploadImageToBlob(req.file, plate);
      } catch (uploadError) {
        console.error('❌ Erro no upload da imagem:', uploadError);
        return res.status(500).json({ 
          error: `Falha no upload da imagem: ${uploadError.message}` 
        });
      }
    }

    // Criar objeto do veículo
    const vehicle = new Vehicle(
      'vehicle', 
      plate, 
      brand, 
      model, 
      parseInt(year), 
      plate, 
      parseFloat(dailyPrice), 
      true, 
      imageUrl
    );
    
    console.log('💾 Salvando veículo no Table Storage...');
    
    // Salvar no Azure Table Storage
    await vehicleTableClient.createEntity(vehicle);
    
    console.log('✅ Veículo criado com sucesso');
    
    res.status(201).json({ 
      message: 'Veículo criado com sucesso',
      vehicle: {
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        plate: vehicle.plate,
        dailyPrice: vehicle.dailyPrice,
        available: vehicle.available,
        imageUrl: vehicle.imageUrl
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no createVehicle:', error);
    
    if (error.statusCode === 409) {
      return res.status(409).json({ 
        error: 'Já existe um veículo com esta placa' 
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Erro interno do servidor ao criar veículo' 
    });
  }
};

// ✅ CORRIGIDO - Get All Vehicles
const getAllVehicles = async (req, res) => {
  try {
    console.log('📋 Listando todos os veículos...');
    
    const vehicles = [];
    const entities = vehicleTableClient.listEntities();
    
    for await (const entity of entities) {
      vehicles.push(entity);
    }
    
    console.log(`✅ Encontrados ${vehicles.length} veículos`);
    
    res.json(vehicles);
  } catch (error) {
    console.error('❌ Erro no getAllVehicles:', error);
    res.status(500).json({ error: 'Erro ao carregar veículos' });
  }
};

// ✅ CORRIGIDO - Get Vehicle by Plate
const getVehicle = async (req, res) => {
  try {
    const { plate } = req.params;
    console.log(`🔍 Buscando veículo: ${plate}`);
    
    const vehicle = await vehicleTableClient.getEntity('vehicle', plate);
    
    console.log('✅ Veículo encontrado');
    res.json(vehicle);
  } catch (error) {
    console.error('❌ Veículo não encontrado:', error);
    res.status(404).json({ error: 'Veículo não encontrado' });
  }
};

// ✅ CORRIGIDO - Update Vehicle
const updateVehicle = async (req, res) => {
  try {
    const { plate } = req.params;
    const { brand, model, year, dailyPrice, available } = req.body;
    
    console.log(`✏️ Atualizando veículo: ${plate}`);
    console.log('📦 Dados de atualização:', req.body);
    console.log('🖼️ Arquivo:', req.file ? 'Sim' : 'Não');

    // Buscar veículo existente
    let vehicle;
    try {
      vehicle = await vehicleTableClient.getEntity('vehicle', plate);
    } catch {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    let imageUrl = vehicle.imageUrl;
    
    // Upload da nova imagem se fornecida
    if (req.file) {
      try {
        imageUrl = await uploadImageToBlob(req.file, plate);
        console.log('✅ Nova imagem uploadada:', imageUrl);
      } catch (uploadError) {
        console.error('❌ Erro no upload da nova imagem:', uploadError);
        return res.status(500).json({ 
          error: `Falha no upload da imagem: ${uploadError.message}` 
        });
      }
    }

    // Preparar dados atualizados
    const updatedVehicle = {
      ...vehicle,
      partitionKey: 'vehicle',
      rowKey: plate,
      brand: brand || vehicle.brand,
      model: model || vehicle.model,
      year: year ? parseInt(year) : vehicle.year,
      dailyPrice: dailyPrice ? parseFloat(dailyPrice) : vehicle.dailyPrice,
      available: available !== undefined ? (available === 'true') : vehicle.available,
      imageUrl: imageUrl
    };

    console.log('💾 Salvando atualizações...');
    
    // Atualizar no Azure Table Storage
    await vehicleTableClient.updateEntity(updatedVehicle, 'Replace');
    
    console.log('✅ Veículo atualizado com sucesso');
    
    res.json({ 
      message: 'Veículo atualizado com sucesso',
      vehicle: updatedVehicle 
    });
  } catch (error) {
    console.error('❌ Erro no updateVehicle:', error);
    res.status(500).json({ error: 'Erro ao atualizar veículo' });
  }
};

// ✅ CORRIGIDO - Delete Vehicle
const deleteVehicle = async (req, res) => {
  try {
    const { plate } = req.params;
    console.log(`🗑️ Excluindo veículo: ${plate}`);
    
    await vehicleTableClient.deleteEntity('vehicle', plate);
    
    console.log('✅ Veículo excluído com sucesso');
    
    res.status(200).json({ message: 'Veículo deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro no deleteVehicle:', error);
    res.status(500).json({ error: 'Erro ao excluir veículo' });
  }
};

// ✅ Exportação CORRIGIDA
module.exports = {
  createVehicle,
  getAllVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle
};