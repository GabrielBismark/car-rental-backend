require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeStorage } = require('./config/azureStorage');

const vehicleRoutes = require('./routes/vehicles');
const clientRoutes = require('./routes/clients');
const rentalRoutes = require('./routes/rentals');

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ CORS CONFIGURADO CORRETAMENTE
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000', 
    'https://car-rental-frontend.vercel.app',
    'https://car-rental-frontend-git-main-gabrielbismarks-projects.vercel.app',
    'https://car-rental-frontend-*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Ou use CORS liberado para todos (mais fácil para teste):
app.use(cors({
  origin: "*", // ⚠️ Permite TODOS os domínios (apenas para teste)
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Suas rotas
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/rentals', rentalRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend funcionando',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à API de Locação de Veículos',
    version: '1.0.0',
    environment: NODE_ENV,
    status: 'Online',
    endpoints: {
      vehicles: '/api/vehicles',
      clients: '/api/clients', 
      rentals: '/api/rentals',
      health: '/health'
    }
  });
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('Erro:', error);
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Erro interno do servidor' : error.message
  });
});

// Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Inicializar servidor
async function startServer() {
  try {
    console.log('🔧 Inicializando Azure Storage...');
    await initializeStorage();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log(`🚗 ${process.env.APP_NAME || 'Car Rental API'}`);
      console.log(`📍 Ambiente: ${NODE_ENV}`);
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
      console.log(`🔗 Health check: /health`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Recebido SIGINT. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Recebido SIGTERM. Encerrando servidor...');
  process.exit(0);
});

startServer();