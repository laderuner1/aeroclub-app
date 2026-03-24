const express = require('express');
const router = express.Router();
const { getDb, run, all, get, lastId } = require('../db/database');

router.get('/', async (req, res) => {
  try {
    await getDb();
    res.json({ ok: true, data: all('SELECT * FROM pilotos ORDER BY apellido, nombre') });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    await getDb();
    const p = get('SELECT * FROM pilotos WHERE id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ ok: false, error: 'Piloto no encontrado' });
    res.json({ ok: true, data: p });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    await getDb();
    const { nombre, apellido, dni, licencia, categoria, horas_vuelo=0, email='', telefono='' } = req.body;
    if (!nombre || !apellido || !dni || !licencia || !categoria)
      return res.status(400).json({ ok: false, error: 'Campos obligatorios: nombre, apellido, dni, licencia, categoria' });
    run('INSERT INTO pilotos (nombre,apellido,dni,licencia,categoria,horas_vuelo,email,telefono) VALUES (?,?,?,?,?,?,?,?)',
      [nombre, apellido, dni, licencia, categoria, horas_vuelo, email, telefono]);
    res.status(201).json({ ok: true, data: get('SELECT * FROM pilotos WHERE id=?', [lastId('pilotos')]) });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ ok: false, error: 'El DNI ya existe' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await getDb();
    const { nombre, apellido, dni, licencia, categoria, horas_vuelo, email, telefono, activo=1 } = req.body;
    run('UPDATE pilotos SET nombre=?,apellido=?,dni=?,licencia=?,categoria=?,horas_vuelo=?,email=?,telefono=?,activo=? WHERE id=?',
      [nombre, apellido, dni, licencia, categoria, horas_vuelo, email, telefono, activo, req.params.id]);
    res.json({ ok: true, data: get('SELECT * FROM pilotos WHERE id=?', [req.params.id]) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await getDb();
    run('DELETE FROM pilotos WHERE id=?', [req.params.id]);
    res.json({ ok: true, message: 'Piloto eliminado' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;
