const express = require('express');
const router  = express.Router();
const { getDb, run, all, get, lastId } = require('../db/database');

const SELECT_VUELO = `
  SELECT v.*,
    p.nombre || ' ' || p.apellido AS piloto_nombre,
    p.licencia  AS piloto_licencia,
    a.matricula AS aeronave_matricula,
    a.marca || ' ' || a.modelo AS aeronave_descripcion,
    i.nombre || ' ' || i.apellido AS instructor_nombre,
    i.licencia_instruccion       AS instructor_licencia
  FROM vuelos v
  JOIN pilotos   p ON v.piloto_id   = p.id
  JOIN aeronaves a ON v.aeronave_id = a.id
  LEFT JOIN pilotos i ON v.instructor_id = i.id
`;

router.get('/', async (req, res) => {
  try {
    await getDb();
    const { estado, fecha } = req.query;
    let sql = SELECT_VUELO, params = [];
    if (estado || fecha) {
      const conds = [];
      if (estado) { conds.push('v.estado = ?'); params.push(estado); }
      if (fecha)  { conds.push('v.fecha  = ?'); params.push(fecha);  }
      sql += ' WHERE ' + conds.join(' AND ');
    }
    sql += ' ORDER BY v.fecha DESC, v.hora_despegue DESC';
    res.json({ ok: true, data: all(sql, params) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    await getDb();
    const hoy = new Date().toISOString().split('T')[0];
    const stats = {
      total_vuelos:         get('SELECT COUNT(*) as n FROM vuelos').n,
      en_vuelo:             get("SELECT COUNT(*) as n FROM vuelos WHERE estado='En Vuelo'").n,
      completados:          get("SELECT COUNT(*) as n FROM vuelos WHERE estado='Completado'").n,
      planificados:         get("SELECT COUNT(*) as n FROM vuelos WHERE estado='Planificado'").n,
      horas_hoy:            get('SELECT COALESCE(ROUND(SUM(duracion_min)/60.0,1),0) as h FROM vuelos WHERE fecha=? AND estado=?', [hoy,'Completado']).h,
      pilotos_activos:      get('SELECT COUNT(*) as n FROM pilotos WHERE activo=1').n,
      aeronaves_operativas: get("SELECT COUNT(*) as n FROM aeronaves WHERE estado='Operativa'").n,
    };
    res.json({ ok: true, data: stats });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    await getDb();
    const v = get(SELECT_VUELO + ' WHERE v.id = ?', [req.params.id]);
    if (!v) return res.status(404).json({ ok: false, error: 'Vuelo no encontrado' });
    res.json({ ok: true, data: v });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    await getDb();
    const { piloto_id, aeronave_id, fecha, hora_despegue, origen, destino,
            tipo_vuelo = 'Local', observaciones = null, instructor_id = null } = req.body;
    if (!piloto_id || !aeronave_id || !fecha || !hora_despegue || !origen || !destino)
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    if (tipo_vuelo === 'Instruccion' && !instructor_id)
      return res.status(400).json({ ok: false, error: 'Los vuelos de instrucción requieren un instructor a cargo' });
    run(`INSERT INTO vuelos (piloto_id,aeronave_id,fecha,hora_despegue,origen,destino,tipo_vuelo,observaciones,estado,instructor_id)
         VALUES (?,?,?,?,?,?,?,?,'Planificado',?)`,
      [piloto_id, aeronave_id, fecha, hora_despegue, origen, destino, tipo_vuelo, observaciones, instructor_id]);
    res.status(201).json({ ok: true, data: get(SELECT_VUELO + ' WHERE v.id=?', [lastId('vuelos')]) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    await getDb();
    const { piloto_id, aeronave_id, fecha, hora_despegue, hora_aterrizaje = null,
            duracion_min = null, origen, destino, tipo_vuelo, observaciones = null,
            estado, instructor_id = null } = req.body;
    if (tipo_vuelo === 'Instruccion' && !instructor_id)
      return res.status(400).json({ ok: false, error: 'Los vuelos de instrucción requieren un instructor a cargo' });
    run(`UPDATE vuelos SET piloto_id=?,aeronave_id=?,fecha=?,hora_despegue=?,
         hora_aterrizaje=?,duracion_min=?,origen=?,destino=?,tipo_vuelo=?,observaciones=?,estado=?,instructor_id=?
         WHERE id=?`,
      [piloto_id, aeronave_id, fecha, hora_despegue, hora_aterrizaje,
       duracion_min, origen, destino, tipo_vuelo, observaciones, estado, instructor_id, req.params.id]);
    res.json({ ok: true, data: get(SELECT_VUELO + ' WHERE v.id=?', [req.params.id]) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await getDb();
    run('DELETE FROM vuelos WHERE id=?', [req.params.id]);
    res.json({ ok: true, message: 'Vuelo eliminado' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;
