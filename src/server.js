require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeStorage } = require('./config/azureStorage');

const vehicleRoutes = require('./routes/vehicles');
const clientRoutes = require('./routes/clients');
const rentalRoutes = require('./routes/rentals');

const app = express();

// ✅ VARIÁVEIS CORRETAS
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ✅ CORS CONFIGURADO
app.use(cors({
  origin: "*", // Permite todos para teste
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/rentals', rentalRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend funcionando',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à API de Locação de Veículos',
    version: '1.0.0',
    environment: NODE_ENV,
    status: 'Online'
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Erro:', error);
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Erro interno do servidor' : error.message
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicializar servidor
async function startServer() {
  try {
    console.log('🔧 Inicializando Azure Storage...');
    await initializeStorage();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log(`🚗 ${process.env.APP_NAME || 'Car Rental API'}`);
      console.log(`📍 Ambiente: ${NODE_ENV}`); // ✅ VARIÁVEL CORRETA
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
      console.log(`🔗 Health: /health`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

startServer();