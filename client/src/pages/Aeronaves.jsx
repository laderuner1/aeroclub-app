import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../api.js'
import { badgeEstado } from '../utils.jsx'

const EMPTY = {
  matricula: '', marca: '', modelo: '', tipo: 'Avion',
  motor: '', año: '', estado: 'Operativa', horas_totales: 0
}

export default function Aeronaves({ toast, onSave }) {
  const [aeronaves, setAeronaves] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState({ open: false, data: null })
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await apiFetch('/aeronaves'); setAeronaves(r.data) }
    catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  const openModal = (a = null) => {
    setForm(a ? { ...EMPTY, ...a, motor: a.motor || '', año: a.año || '' } : { ...EMPTY })
    setModal({ open: true, data: a })
  }

  const closeModal = () => setModal({ open: false, data: null })
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const save = async () => {
    const matricula = form.matricula.trim().toUpperCase()
    if (!matricula)           { toast('Ingresá la matrícula', 'error'); return }
    if (!form.marca.trim())   { toast('Ingresá la marca', 'error');     return }
    if (!form.modelo.trim())  { toast('Ingresá el modelo', 'error');    return }

    const body = {
      matricula,
      marca:         form.marca.trim(),
      modelo:        form.modelo.trim(),
      tipo:          form.tipo,
      motor:         form.motor.trim()  || null,
      año:           form.año           ? +form.año : null,
      estado:        form.estado,
      horas_totales: +form.horas_totales || 0
    }

    setSaving(true)
    try {
      if (modal.data?.id) {
        await apiFetch(`/aeronaves/${modal.data.id}`, { method: 'PUT', body })
        toast('🛩️ Aeronave actualizada')
      } else {
        await apiFetch('/aeronaves', { method: 'POST', body })
        toast('🛩️ Aeronave registrada')
      }
      closeModal(); load(); onSave()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('¿Confirmar eliminación de la aeronave?')) return
    try {
      await apiFetch(`/aeronaves/${id}`, { method: 'DELETE' })
      toast('Aeronave eliminada'); load(); onSave()
    } catch (e) { toast(e.message, 'error') }
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🛩️ Aeronaves</h3>
          <div className="card-options">
            <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
              + Nueva Aeronave
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Aeronave</th>
                <th>Tipo</th>
                <th>Motor</th>
                <th>Año</th>
                <th>Horas Totales</th>
                <th>Estado</th>
                <th style={{ width: 90 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-4 text-muted">Cargando...</td></tr>}
              {!loading && aeronaves.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div className="text-muted mb-3" style={{ fontSize: '2.5rem' }}>🛩️</div>
                    <p className="text-muted mb-3">No hay aeronaves registradas</p>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                      + Agregar primera aeronave
                    </button>
                  </td>
                </tr>
              )}
              {aeronaves.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.matricula}</strong></td>
                  <td>{a.marca} {a.modelo}</td>
                  <td><span className="badge bg-secondary-lt">{a.tipo}</span></td>
                  <td>{a.motor || <span className="text-muted">—</span>}</td>
                  <td>{a.año   || <span className="text-muted">—</span>}</td>
                  <td>{(+a.horas_totales).toFixed(1)} hs</td>
                  <td>{badgeEstado(a.estado)}</td>
                  <td>
                    <button className="btn btn-sm btn-icon btn-ghost-primary me-1" onClick={() => openModal(a)} title="Editar">✏️</button>
                    <button className="btn btn-sm btn-icon btn-ghost-danger" onClick={() => del(a.id)} title="Eliminar">🗑️</button>
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
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{modal.data ? 'Editar Aeronave' : 'Nueva Aeronave'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Matrícula</label>
                      <input type="text" className="form-control" placeholder="LV-ABC" value={form.matricula} onChange={e => set('matricula', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Tipo</label>
                      <select className="form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                        <option>Avion</option>
                        <option>Planeador</option>
                        <option>Ultraliviano</option>
                        <option>Helicoptero</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Marca</label>
                      <input type="text" className="form-control" placeholder="Cessna" value={form.marca} onChange={e => set('marca', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Modelo</label>
                      <input type="text" className="form-control" placeholder="172 Skyhawk" value={form.modelo} onChange={e => set('modelo', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Motor</label>
                      <input type="text" className="form-control" placeholder="Lycoming O-320" value={form.motor} onChange={e => set('motor', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Año</label>
                      <input type="number" className="form-control" placeholder="1985" value={form.año} onChange={e => set('año', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Estado</label>
                      <select className="form-select" value={form.estado} onChange={e => set('estado', e.target.value)}>
                        <option>Operativa</option>
                        <option>En Mantenimiento</option>
                        <option>Baja</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-0">
                      <label className="form-label">Horas Totales</label>
                      <input type="number" className="form-control" step="0.5" value={form.horas_totales} onChange={e => set('horas_totales', e.target.value)} />
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
