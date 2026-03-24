import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../api.js'
import { badgeCategoria, badgeRol } from '../utils.jsx'
import PilotoModal from './PilotoModal.jsx'

export default function Pilotos({ toast, onSave }) {
  const [pilotos, setPilotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState({ open: false, data: null })

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await apiFetch('/pilotos'); setPilotos(r.data) }
    catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  const del = async (id) => {
    if (!confirm('¿Confirmar eliminación del piloto?')) return
    try {
      await apiFetch(`/pilotos/${id}`, { method: 'DELETE' })
      toast('Piloto eliminado'); load(); onSave()
    } catch (e) { toast(e.message, 'error') }
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">👨‍✈️ Pilotos</h3>
          <div className="card-options">
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, data: null })}>
              + Nuevo Piloto
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Licencia</th>
                <th>Categoría</th>
                <th>Rol</th>
                <th>Horas de Vuelo</th>
                <th>Email</th>
                <th style={{ width: 90 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-4 text-muted">Cargando...</td></tr>}
              {!loading && pilotos.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div className="text-muted mb-3" style={{ fontSize: '2.5rem' }}>👨‍✈️</div>
                    <p className="text-muted mb-3">No hay pilotos registrados</p>
                    <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, data: null })}>
                      + Agregar primer piloto
                    </button>
                  </td>
                </tr>
              )}
              {pilotos.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.apellido}, {p.nombre}</strong></td>
                  <td>{p.dni}</td>
                  <td>{p.licencia}</td>
                  <td>{badgeCategoria(p.categoria)}</td>
                  <td>{badgeRol(p.rol || 'Piloto')}</td>
                  <td>{(+p.horas_vuelo).toFixed(1)} hs</td>
                  <td>{p.email || <span className="text-muted">—</span>}</td>
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
      />
    </>
  )
}
