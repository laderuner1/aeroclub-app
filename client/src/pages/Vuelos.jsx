import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../api.js'
import { badgeEstado, formatDuracion } from '../utils.jsx'

const EMPTY = {
  piloto_id: '', aeronave_id: '', instructor_id: '',
  fecha: new Date().toISOString().split('T')[0],
  hora_despegue: '', hora_aterrizaje: '', duracion_min: '',
  origen: '', destino: '', tipo_vuelo: 'Local',
  estado: 'Planificado', observaciones: ''
}

export default function Vuelos({ toast, onSave }) {
  const [vuelos,      setVuelos]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState({ open: false, data: null })
  const [form,        setForm]        = useState(EMPTY)
  const [pilotos,     setPilotos]     = useState([])
  const [aeronaves,   setAeronaves]   = useState([])
  const [instructores,setInstructores]= useState([])
  const [saving,      setSaving]      = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await apiFetch('/vuelos'); setVuelos(r.data) }
    catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  const openModal = async (vuelo = null) => {
    try {
      const [p, a, i] = await Promise.all([
        apiFetch('/pilotos'),
        apiFetch('/aeronaves'),
        apiFetch('/pilotos/instructores')
      ])
      setPilotos(p.data.filter(x => x.activo))
      setAeronaves(a.data.filter(x => x.estado === 'Operativa'))
      setInstructores(i.data)
    } catch (e) { toast(e.message, 'error'); return }

    setForm(vuelo ? {
      ...EMPTY, ...vuelo,
      hora_aterrizaje: vuelo.hora_aterrizaje || '',
      duracion_min:    vuelo.duracion_min    || '',
      observaciones:   vuelo.observaciones   || '',
      instructor_id:   vuelo.instructor_id   || ''
    } : { ...EMPTY, fecha: new Date().toISOString().split('T')[0] })
    setModal({ open: true, data: vuelo })
  }

  const closeModal = () => setModal({ open: false, data: null })

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const save = async () => {
    if (!form.piloto_id)   { toast('Seleccioná un piloto', 'error');   return }
    if (!form.aeronave_id) { toast('Seleccioná una aeronave', 'error'); return }
    if (!form.fecha)       { toast('Ingresá la fecha', 'error');        return }
    if (!form.hora_despegue){ toast('Ingresá hora de despegue', 'error'); return }
    if (!form.origen.trim()){ toast('Ingresá el origen', 'error');      return }
    if (!form.destino.trim()){ toast('Ingresá el destino', 'error');    return }
    if (form.tipo_vuelo === 'Instruccion' && !form.instructor_id) {
      toast('Seleccioná un instructor a cargo', 'error'); return
    }

    // Auto-calcular duración si hay aterrizaje y no hay duración
    let duracion_min = form.duracion_min ? +form.duracion_min : null
    if (form.hora_aterrizaje && form.hora_despegue && !duracion_min) {
      const [dh, dm] = form.hora_despegue.split(':').map(Number)
      const [ah, am] = form.hora_aterrizaje.split(':').map(Number)
      const diff = (ah * 60 + am) - (dh * 60 + dm)
      if (diff > 0) duracion_min = diff
    }

    const body = {
      piloto_id:       +form.piloto_id,
      aeronave_id:     +form.aeronave_id,
      fecha:           form.fecha,
      hora_despegue:   form.hora_despegue,
      hora_aterrizaje: form.hora_aterrizaje || null,
      duracion_min,
      origen:          form.origen.trim(),
      destino:         form.destino.trim(),
      tipo_vuelo:      form.tipo_vuelo,
      estado:          form.estado,
      observaciones:   form.observaciones.trim() || null,
      instructor_id:   form.instructor_id ? +form.instructor_id : null,
    }

    setSaving(true)
    try {
      if (modal.data?.id) {
        await apiFetch(`/vuelos/${modal.data.id}`, { method: 'PUT', body })
        toast('✈️ Vuelo actualizado')
      } else {
        await apiFetch('/vuelos', { method: 'POST', body })
        toast('✈️ Vuelo registrado')
      }
      closeModal(); load(); onSave()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Confirmar eliminación del vuelo?')) return
    try {
      await apiFetch(`/vuelos/${id}`, { method: 'DELETE' })
      toast('Vuelo eliminado'); load(); onSave()
    } catch (e) { toast(e.message, 'error') }
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">✈️ Registro de Vuelos</h3>
          <div className="card-options">
            <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
              + Nuevo Vuelo
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Fecha / Horario</th>
                <th>Piloto</th>
                <th>Aeronave</th>
                <th>Ruta</th>
                <th>Tipo</th>
                <th>Instructor</th>
                <th>Duración</th>
                <th>Estado</th>
                <th style={{ width: 90 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="text-center py-4 text-muted">Cargando...</td></tr>
              )}
              {!loading && vuelos.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <div className="text-muted mb-3" style={{ fontSize: '2.5rem' }}>✈️</div>
                    <p className="text-muted mb-3">No hay vuelos registrados</p>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                      + Registrar primer vuelo
                    </button>
                  </td>
                </tr>
              )}
              {vuelos.map(v => (
                <tr key={v.id}>
                  <td>
                    <strong>{v.fecha}</strong><br />
                    <small className="text-muted">
                      {v.hora_despegue}{v.hora_aterrizaje ? ` → ${v.hora_aterrizaje}` : ' → en curso'}
                    </small>
                  </td>
                  <td>
                    {v.piloto_nombre}<br />
                    <small className="text-muted">{v.piloto_licencia}</small>
                  </td>
                  <td>
                    <strong>{v.aeronave_matricula}</strong><br />
                    <small className="text-muted">{v.aeronave_descripcion}</small>
                  </td>
                  <td>{v.origen} → {v.destino}</td>
                  <td><span className="badge bg-secondary-lt">{v.tipo_vuelo}</span></td>
                  <td>
                    {v.tipo_vuelo === 'Instruccion' && v.instructor_nombre
                      ? <>{v.instructor_nombre}<br /><small className="text-muted">{v.instructor_licencia}</small></>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>{formatDuracion(v.duracion_min)}</td>
                  <td>{badgeEstado(v.estado)}</td>
                  <td>
                    <button className="btn btn-sm btn-icon btn-ghost-primary me-1" onClick={() => openModal(v)} title="Editar">✏️</button>
                    <button className="btn btn-sm btn-icon btn-ghost-danger" onClick={() => del(v.id)} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ── */}
      {modal.open && (
        <>
          <div className="modal modal-blur fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{modal.data ? 'Editar Vuelo' : 'Nuevo Vuelo'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Piloto</label>
                      <select className="form-select" value={form.piloto_id} onChange={e => set('piloto_id', e.target.value)}>
                        <option value="">— Seleccionar piloto —</option>
                        {pilotos.map(p => (
                          <option key={p.id} value={p.id}>{p.apellido}, {p.nombre} ({p.categoria} · {p.licencia})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Aeronave</label>
                      <select className="form-select" value={form.aeronave_id} onChange={e => set('aeronave_id', e.target.value)}>
                        <option value="">— Seleccionar aeronave —</option>
                        {aeronaves.map(a => (
                          <option key={a.id} value={a.id}>{a.matricula} · {a.marca} {a.modelo}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Fecha</label>
                      <input type="date" className="form-control" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Tipo de Vuelo</label>
                      <select className="form-select" value={form.tipo_vuelo}
                        onChange={e => setForm(f => ({ ...f, tipo_vuelo: e.target.value, instructor_id: '' }))}>
                        <option>Local</option>
                        <option>Instruccion</option>
                        <option>Traslado</option>
                        <option>Acrobatico</option>
                      </select>
                    </div>
                    {form.tipo_vuelo === 'Instruccion' && (
                      <div className="col-12 mb-3">
                        <label className="form-label required">Instructor a Cargo</label>
                        <select className="form-select" value={form.instructor_id} onChange={e => set('instructor_id', e.target.value)}>
                          <option value="">— Seleccionar instructor —</option>
                          {instructores.map(i => (
                            <option key={i.id} value={i.id}>{i.apellido}, {i.nombre} ({i.licencia_instruccion || i.licencia})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Hora Despegue</label>
                      <input type="time" className="form-control" value={form.hora_despegue} onChange={e => set('hora_despegue', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Hora Aterrizaje</label>
                      <input type="time" className="form-control" value={form.hora_aterrizaje} onChange={e => set('hora_aterrizaje', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Origen</label>
                      <input type="text" className="form-control" placeholder="Ej: Villa Dolores" value={form.origen} onChange={e => set('origen', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Destino</label>
                      <input type="text" className="form-control" placeholder="Ej: Córdoba" value={form.destino} onChange={e => set('destino', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Duración (min)</label>
                      <input type="number" className="form-control" placeholder="Auto si hay aterrizaje" value={form.duracion_min} onChange={e => set('duracion_min', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Estado</label>
                      <select className="form-select" value={form.estado} onChange={e => set('estado', e.target.value)}>
                        <option>Planificado</option>
                        <option>En Vuelo</option>
                        <option>Completado</option>
                        <option>Cancelado</option>
                      </select>
                    </div>
                    <div className="col-12 mb-0">
                      <label className="form-label">Observaciones</label>
                      <textarea className="form-control" rows={2} placeholder="Notas adicionales..." value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary me-auto" onClick={closeModal}>Cancelar</button>
                  <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                    {saving ? 'Guardando…' : '💾 Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  )
}
