import { useState, useEffect } from 'react'
import { apiFetch } from '../api.js'

const CARDS = [
  { key: 'total_vuelos',         label: 'Total Vuelos',         color: 'blue',   icon: '✈️'  },
  { key: 'en_vuelo',             label: 'En Vuelo',             color: 'yellow', icon: '🛫'  },
  { key: 'completados',          label: 'Completados',          color: 'green',  icon: '✅'  },
  { key: 'horas_hoy',            label: 'Horas Hoy',            color: 'cyan',   icon: '⏱️', suffix: 'h' },
  { key: 'pilotos_activos',      label: 'Pilotos Activos',      color: 'purple', icon: '👨‍✈️' },
  { key: 'aeronaves_operativas', label: 'Aeronaves Operativas', color: 'teal',   icon: '🛩️'  },
]

export default function StatsGrid() {
  const [stats, setStats] = useState({})

  useEffect(() => {
    apiFetch('/vuelos/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <div className="row row-deck row-cards mb-4">
      {CARDS.map(c => (
        <div key={c.key} className="col-6 col-sm-4 col-lg-2">
          <div className="card">
            <div className="card-body p-3 text-center">
              <div style={{ fontSize: '1.6rem', lineHeight: 1, marginBottom: 4 }}>{c.icon}</div>
              <div className={`h2 mb-1 text-${c.color}`} style={{ fontWeight: 800 }}>
                {stats[c.key] != null ? (stats[c.key] + (c.suffix || '')) : '—'}
              </div>
              <div className="text-muted" style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                {c.label}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
