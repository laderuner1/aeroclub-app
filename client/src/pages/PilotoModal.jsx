import { useState, useEffect } from 'react'
import { apiFetch } from '../api.js'

const EMPTY = {
  nombre: '', apellido: '', dni: '', licencia: '',
  categoria: 'PPL', horas_vuelo: 0, email: '', telefono: '',
  rol: 'Piloto', licencia_instruccion: '', especialidades: []
}

const ESPECIALIDADES = ['PPL', 'CPL', 'IFR', 'PVL', 'Acrobacia', 'Ultraliviano']

export default function PilotoModal({ isOpen, onClose, piloto, onSaved, toast, forceInstructor = false }) {
  const [form,   setForm]   = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (piloto) {
      const esp = piloto.especialidades
        ? piloto.especialidades.split(',').map(s => s.trim()).filter(Boolean)
        : []
      setForm({ ...EMPTY, ...piloto, especialidades: esp, licencia_instruccion: piloto.licencia_instruccion || '' })
    } else {
      setForm({ ...EMPTY, rol: forceInstructor ? 'Instructor' : 'Piloto' })
    }
  }, [isOpen, piloto, forceInstructor])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const toggleEsp = (val) => setForm(f => ({
    ...f,
    especialidades: f.especialidades.includes(val)
      ? f.especialidades.filter(e => e !== val)
      : [...f.especialidades, val]
  }))

  const save = async () => {
    if (!form.nombre.trim())   { toast('Ingresá el nombre', 'error');   return }
    if (!form.apellido.trim()) { toast('Ingresá el apellido', 'error'); return }
    if (!form.dni.trim())      { toast('Ingresá el DNI', 'error');      return }
    if (!form.licencia.trim()) { toast('Ingresá la licencia', 'error'); return }
    if (form.rol === 'Instructor' && !form.licencia_instruccion.trim()) {
      toast('Ingresá la licencia de instrucción', 'error'); return
    }

    const body = {
      nombre:               form.nombre.trim(),
      apellido:             form.apellido.trim(),
      dni:                  form.dni.trim(),
      licencia:             form.licencia.trim(),
      categoria:            form.categoria,
      horas_vuelo:          +form.horas_vuelo || 0,
      email:                form.email.trim()   || null,
      telefono:             form.telefono.trim() || null,
      activo:               1,
      rol:                  form.rol,
      licencia_instruccion: form.licencia_instruccion.trim() || null,
      especialidades:       form.especialidades.join(', ') || null,
    }

    setSaving(true)
    try {
      if (piloto?.id) {
        await apiFetch(`/pilotos/${piloto.id}`, { method: 'PUT', body })
        toast(form.rol === 'Instructor' ? '🎓 Instructor actualizado' : '👨‍✈️ Piloto actualizado')
      } else {
        await apiFetch('/pilotos', { method: 'POST', body })
        toast(form.rol === 'Instructor' ? '🎓 Instructor registrado' : '👨‍✈️ Piloto registrado')
      }
      onSaved()
      onClose()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="modal modal-blur fade show" style={{ display: 'block' }} tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{piloto ? 'Editar Piloto' : 'Nuevo Piloto'}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label required">Nombre</label>
                  <input type="text" className="form-control" placeholder="Francisco" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label required">Apellido</label>
                  <input type="text" className="form-control" placeholder="García" value={form.apellido} onChange={e => set('apellido', e.target.value)} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label required">DNI</label>
                  <input type="text" className="form-control" placeholder="28.111.222" value={form.dni} onChange={e => set('dni', e.target.value)} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label required">N° Licencia</label>
                  <input type="text" className="form-control" placeholder="PPL-0001" value={form.licencia} onChange={e => set('licencia', e.target.value)} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label required">Categoría</label>
                  <select className="form-select" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                    <option value="PPL">PPL - Piloto Privado</option>
                    <option value="CPL">CPL - Piloto Comercial</option>
                    <option value="ATPL">ATPL - Piloto de Línea Aérea</option>
                    <option value="PVL">PVL - Piloto de Planeador</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Horas de Vuelo</label>
                  <input type="number" className="form-control" step="0.5" value={form.horas_vuelo} onChange={e => set('horas_vuelo', e.target.value)} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" placeholder="piloto@aeroclub.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Teléfono</label>
                  <input type="text" className="form-control" placeholder="351-111-2222" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label required">Rol</label>
                  <select className="form-select" value={form.rol} onChange={e => set('rol', e.target.value)}>
                    <option value="Piloto">Piloto</option>
                    <option value="Instructor">Piloto Instructor</option>
                  </select>
                </div>

                {/* Campos de instructor — solo visibles si rol = Instructor */}
                {form.rol === 'Instructor' && (
                  <>
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Licencia de Instrucción</label>
                      <input type="text" className="form-control" placeholder="FI-0001" value={form.licencia_instruccion} onChange={e => set('licencia_instruccion', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Especialidades</label>
                      <div className="d-flex flex-wrap gap-2 mt-1">
                        {ESPECIALIDADES.map(e => (
                          <label key={e} className="form-check form-check-inline m-0">
                            <input
                              type="checkbox"
                              className="form-check-input me-1"
                              checked={form.especialidades.includes(e)}
                              onChange={() => toggleEsp(e)}
                            />
                            <span className="form-check-label">{e}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary me-auto" onClick={onClose}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Guardando…' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  )
}
