const { TableClient } = require('@azure/data-tables');
const { BlobServiceClient } = require('@azure/storage-blob');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  throw new Error('AZURE_STORAGE_CONNECTION_STRING não está definida nas variáveis de ambiente');
}

// Table Clients
const vehicleTableClient = TableClient.fromConnectionString(connectionString, 'vehicles');
const clientTableClient = TableClient.fromConnectionString(connectionString, 'clients');
const rentalTableClient = TableClient.fromConnectionString(connectionString, 'rentals');

// Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerName = 'bismark';
const containerClient = blobServiceClient.getContainerClient(containerName);

// Inicializar containers e tabelas
async function initializeStorage() {
  try {
    // Criar tabelas se não existirem
    await vehicleTableClient.createTable();
    console.log('✅ Tabela de veículos criada/verificada');
    
    await clientTableClient.createTable();
    console.log('✅ Tabela de clientes criada/verificada');
    
    await rentalTableClient.createTable();
    console.log('✅ Tabela de locações criada/verificada');
    
    // Criar container de imagens se não existir
    const createContainerResponse = await containerClient.createIfNotExists({
      access: 'blob'
    });
    console.log('✅ Container de imagens criado/verificado');
    
  } catch (error) {
    if (error.statusCode === 409) {
      console.log('ℹ️ Tabelas e containers já existem');
    } else {
      console.error('❌ Erro ao inicializar storage:', error.message);
      throw error;
    }
  }
}

// Exportar containerClient explicitamente
module.exports = {
  vehicleTableClient,
  clientTableClient,
  rentalTableClient,
  containerClient, // ✅ AGORA ESTÁ SENDO EXPORTADO
  initializeStorage
};