const initSqlJs = require('sql.js');
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'aeroclub.db');
let db = null;

function saveToDisk() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  initSchema();
  return db;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveToDisk();
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

function lastId(table) {
  return get("SELECT MAX(id) as id FROM "+table).id;
}

function initSchema() {
  db.run(`CREATE TABLE IF NOT EXISTS pilotos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, apellido TEXT NOT NULL,
    dni TEXT UNIQUE NOT NULL, licencia TEXT NOT NULL, categoria TEXT NOT NULL,
    horas_vuelo REAL DEFAULT 0, email TEXT, telefono TEXT, activo INTEGER DEFAULT 1,
    rol TEXT DEFAULT 'Piloto', licencia_instruccion TEXT, especialidades TEXT,
    created_at TEXT DEFAULT (datetime('now')))`);

  // Migración: agregar columnas de instructor si no existen (DBs previas)
  try { db.run(`ALTER TABLE pilotos ADD COLUMN rol TEXT DEFAULT 'Piloto'`); } catch(e) {}
  try { db.run(`ALTER TABLE pilotos ADD COLUMN licencia_instruccion TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE pilotos ADD COLUMN especialidades TEXT`); } catch(e) {}

  db.run(`CREATE TABLE IF NOT EXISTS aeronaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT, matricula TEXT UNIQUE NOT NULL,
    marca TEXT NOT NULL, modelo TEXT NOT NULL, tipo TEXT NOT NULL,
    motor TEXT, año INTEGER, estado TEXT DEFAULT 'Operativa',
    horas_totales REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`);

  db.run(`CREATE TABLE IF NOT EXISTS vuelos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, piloto_id INTEGER NOT NULL,
    aeronave_id INTEGER NOT NULL, fecha TEXT NOT NULL, hora_despegue TEXT NOT NULL,
    hora_aterrizaje TEXT, duracion_min INTEGER, origen TEXT NOT NULL, destino TEXT NOT NULL,
    tipo_vuelo TEXT DEFAULT 'Local', observaciones TEXT, estado TEXT DEFAULT 'Planificado',
    instructor_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')))`);

  // Migración: agregar instructor_id si no existe (DBs previas)
  try { db.run(`ALTER TABLE vuelos ADD COLUMN instructor_id INTEGER`); } catch(e) {}

  if (get('SELECT COUNT(*) as n FROM pilotos').n === 0) seedData();
}

function seedData() {
  const hoy = new Date().toISOString().split('T')[0];
  db.run(`INSERT INTO pilotos VALUES (null,'Francisco','García','28.111.222','PPL-0001','PPL',320.5,'fgarcia@aeroclub.com','351-111-2222',1,datetime('now'))`);
  db.run(`INSERT INTO pilotos VALUES (null,'Martín','López','30.333.444','PPL-0002','PPL',150.0,'mlopez@aeroclub.com','351-333-4444',1,datetime('now'))`);
  db.run(`INSERT INTO pilotos VALUES (null,'Laura','Fernández','25.555.666','CPL-0010','CPL',850.0,'lfernandez@aeroclub.com','351-555-6666',1,datetime('now'))`);
  db.run(`INSERT INTO pilotos VALUES (null,'Carlos','Ruiz','22.777.888','PVL-0005','PVL',210.0,'cruiz@aeroclub.com','351-777-8888',1,datetime('now'))`);
  db.run(`INSERT INTO aeronaves VALUES (null,'LV-ABC','Cessna','172 Skyhawk','Avion','Lycoming O-320',1985,'Operativa',2450.0,datetime('now'))`);
  db.run(`INSERT INTO aeronaves VALUES (null,'LV-XYZ','Piper','PA-28 Cherokee','Avion','Lycoming O-360',1978,'Operativa',3100.5,datetime('now'))`);
  db.run(`INSERT INTO aeronaves VALUES (null,'LV-PLN','Scheibe','SF-25 Falke','Planeador','Rotax 912',2001,'Operativa',980.0,datetime('now'))`);
  db.run(`INSERT INTO aeronaves VALUES (null,'LV-ULT','Aero Boero','AB-115','Avion','Continental O-200',1992,'Operativa',1560.0,datetime('now'))`);
  db.run(`INSERT INTO vuelos VALUES (null,1,1,?,  '09:00','10:30',90, 'Villa Dolores','Córdoba','Local',       null,'Completado', datetime('now'))`, [hoy]);
  db.run(`INSERT INTO vuelos VALUES (null,3,1,?,  '11:00','13:15',135,'Villa Dolores','San Luis','Traslado',   null,'Completado', datetime('now'))`, [hoy]);
  db.run(`INSERT INTO vuelos VALUES (null,2,3,?,  '14:00',null,   null,'Villa Dolores','Local',  'Instruccion',null,'En Vuelo',  datetime('now'))`, [hoy]);
  db.run(`INSERT INTO vuelos VALUES (null,4,3,?,  '16:00',null,   null,'Villa Dolores','Local',  'Local',      null,'Planificado',datetime('now'))`, [hoy]);
  saveToDisk();
  console.log('✅ Datos de ejemplo cargados (Aeroclub Villa Dolores)');
}

module.exports = { getDb, run, all, get, lastId, saveToDisk };
