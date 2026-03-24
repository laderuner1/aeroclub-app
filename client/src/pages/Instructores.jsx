import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../api.js'
import { badgeCategoria } from '../utils.jsx'
import PilotoModal from './PilotoModal.jsx'

export default function Instructores({ toast, onSave }) {
  const [instructores, setInstructores] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState({ open: false, data: null })

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await apiFetch('/pilotos/instructores'); setInstructores(r.data) }
    catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  const del = async (id) => {
    if (!confirm('¿Confirmar eliminación del instructor?')) return
    try {
      await apiFetch(`/pilotos/${id}`, { method: 'DELETE' })
      toast('Instructor eliminado'); load(); onSave()
    } catch (e) { toast(e.message, 'error') }
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🎓 Reporte de Instructores</h3>
          <div className="card-options">
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, data: null })}>
              + Nuevo Instructor
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Lic. Piloto</th>
                <th>Categoría</th>
                <th>Lic. Instrucción</th>
                <th>Especialidades</th>
                <th>Horas de Vuelo</th>
                <th>Contacto</th>
                <th style={{ width: 90 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="text-center py-4 text-muted">Cargando...</td></tr>}
              {!loading && instructores.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <div className="text-muted mb-3" style={{ fontSize: '2.5rem' }}>🎓</div>
                    <p className="text-muted mb-3">No hay instructores registrados</p>
                    <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, data: null })}>
                      + Agregar primer instructor
                    </button>
                  </td>
                </tr>
              )}
              {instructores.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.apellido}, {p.nombre}</strong></td>
                  <td>{p.dni}</td>
                  <td>{p.licencia}</td>
                  <td>{badgeCategoria(p.categoria)}</td>
                  <td><strong>{p.licencia_instruccion || <span className="text-muted">—</span>}</strong></td>
                  <td>
                    {p.especialidades
                      ? p.especialidades.split(',').map(e => (
                          <span key={e} className="badge bg-blue-lt me-1">{e.trim()}</span>
                        ))
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>{(+p.horas_vuelo).toFixed(1)} hs</td>
                  <td>
                    {p.email    && <div><small>{p.email}</small></div>}
                    {p.telefono && <div><small className="text-muted">{p.telefono}</small></div>}
                    {!p.email && !p.telefono && <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-icon btn-ghost-primary me-1" onClick={() => setModal({ open: true, data: p })} title="Editar">✏️</button>
                    <button className="btn btn-sm btn-icon btn-ghost-danger" onClick={() => del(p.id)} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PilotoModal
        isOpen={modal.open}
        piloto={modal.data}
        onClose={() => setModal({ open: false, data: null })}
        onSaved={() => { load(); onSave() }}
        toast={toast}
        forceInstructor={true}
      />
    </>
  )
}
