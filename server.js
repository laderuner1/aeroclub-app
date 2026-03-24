const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { getDb } = require('./db/database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/pilotos',   require('./routes/pilotos'));
app.use('/api/aeronaves', require('./routes/aeronaves'));
app.use('/api/vuelos',    require('./routes/vuelos'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: '✈️ Aeroclub API funcionando', ts: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar BD antes de levantar el servidor
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✈️  ========================================`);
    console.log(`   SISTEMA DE VUELOS - AEROCLUB`);
    console.log(`✈️  ========================================`);
    console.log(`   Servidor:  http://localhost:${PORT}`);
    console.log(`   API REST:  http://localhost:${PORT}/api`);
    console.log(`✈️  ========================================\n`);
  });
}).catch(err => {
  console.error('Error iniciando BD:', err);
  process.exit(1);
});
