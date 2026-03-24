const express = require('express');
const router = express.Router();
const { getDb, run, all, get, lastId } = require('../db/database');

router.get('/', async (req, res) => {
  try {
    await getDb();
    res.json({ ok: true, data: all('SELECT * FROM aeronaves ORDER BY matricula') });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    await getDb();
    const a = get('SELECT * FROM aeronaves WHERE id=?', [req.params.id]);
    if (!a) return res.status(404).json({ ok: false, error: 'Aeronave no encontrada' });
    res.json({ ok: true, data: a });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    await getDb();
    const { matricula, marca, modelo, tipo, motor='', año=null, estado='Operativa', horas_totales=0 } = req.body;
    if (!matricula || !marca || !modelo || !tipo)
      return res.status(400).json({ ok: false, error: 'Campos obligatorios: matricula, marca, modelo, tipo' });
    run('INSERT INTO aeronaves (matricula,marca,modelo,tipo,motor,año,estado,horas_totales) VALUES (?,?,?,?,?,?,?,?)',
      [matricula.toUpperCase(), marca, modelo, tipo, motor, año, estado, horas_totales]);
    res.status(201).json({ ok: true, data: get('SELECT * FROM aeronaves WHERE id=?', [lastId('aeronaves')]) });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ ok: false, error: 'La matrícula ya existe' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await getDb();
    const { matricula, marca, modelo, tipo, motor, año, estado, horas_totales } = req.body;
    run('UPDATE aeronaves SET matricula=?,marca=?,modelo=?,tipo=?,motor=?,año=?,estado=?,horas_totales=? WHERE id=?',
      [matricula?.toUpperCase(), marca, modelo, tipo, motor, año, estado, horas_totales, req.params.id]);
    res.json({ ok: true, data: get('SELECT * FROM aeronaves WHERE id=?', [req.params.id]) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await getDb();
    run('DELETE FROM aeronaves WHERE id=?', [req.params.id]);
    res.json({ ok: true, message: 'Aeronave eliminada' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;
