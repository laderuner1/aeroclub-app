export function badgeEstado(estado) {
  const map = {
    'Planificado':      'bg-blue-lt',
    'En Vuelo':         'bg-yellow-lt',
    'Completado':       'bg-green-lt',
    'Cancelado':        'bg-red-lt',
    'Operativa':        'bg-green-lt',
    'En Mantenimiento': 'bg-yellow-lt',
    'Baja':             'bg-red-lt',
  }
  return <span className={`badge ${map[estado] || 'bg-secondary-lt'}`}>{estado}</span>
}

export function badgeCategoria(cat) {
  const map = { PPL: 'bg-blue-lt', CPL: 'bg-purple-lt', ATPL: 'bg-red-lt', PVL: 'bg-green-lt' }
  return <span className={`badge ${map[cat] || 'bg-secondary-lt'}`}>{cat}</span>
}

export function badgeRol(rol) {
  return rol === 'Instructor'
    ? <span className="badge bg-yellow-lt">🎓 Instructor</span>
    : <span className="badge bg-secondary-lt">Piloto</span>
}

export function formatDuracion(min) {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
