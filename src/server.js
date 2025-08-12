const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - Allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'ContentFlow AI Backend is running!',
    port: PORT,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    ok: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Connection test endpoint
app.get('/api/test/connection', (req, res) => {
  res.json({
    ok: true,
    message: 'Database connection test (simplified)',
    timestamp: new Date().toISOString(),
    note: 'Full database connection will be added once Supabase is configured'
  });
});

// Root endpoint - welcome message
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'ContentFlow AI Backend is running!',
    endpoints: ['/health', '/api/test', '/api/test/connection']
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist.`,
    availableEndpoints: [
      'GET /health',
      'GET /api/test',
      'GET /api/test/connection'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ContentFlow AI Backend running on port ${PORT}`);
  console.log(`📚 Health Check: http://0.0.0.0:${PORT}/health`);
  console.log(`🧪 API Test: http://0.0.0.0:${PORT}/api/test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

module.exports = app;