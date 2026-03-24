export default function Layout({ tab, setTab, tabs, children }) {
  const fecha = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="page">
      {/* ── Sidebar ── */}
      <aside className="navbar navbar-vertical navbar-expand-lg" data-bs-theme="dark">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            onClick={e => e.currentTarget.closest('.navbar').querySelector('.navbar-collapse').classList.toggle('show')}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="navbar-brand py-3">
            <span style={{ fontSize: '1.4rem', marginRight: 8 }}>✈️</span>
            <span className="fw-bold" style={{ fontSize: '1rem', letterSpacing: '-.3px' }}>
              Aeroclub
            </span>
          </div>

          <div className="collapse navbar-collapse">
            <ul className="navbar-nav pt-lg-3">
              {tabs.map(t => (
                <li key={t.id} className="nav-item">
                  <a
                    className={`nav-link ${tab === t.id ? 'active' : ''}`}
                    href="#"
                    onClick={e => { e.preventDefault(); setTab(t.id) }}
                  >
                    <span className="nav-link-icon d-md-none d-lg-inline-block me-2">
                      {t.icon}
                    </span>
                    <span className="nav-link-title">{t.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-auto p-3" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
              <small className="text-muted" style={{ fontSize: '.72rem' }}>
                Sistema de Vuelos v2.0
              </small>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="page-wrapper">
        <div className="page-header d-print-none">
          <div className="container-xl">
            <div className="row g-2 align-items-center">
              <div className="col">
                <h2 className="page-title">Sistema de Vuelos</h2>
                <div className="text-muted mt-1" style={{ textTransform: 'capitalize' }}>
                  {fecha}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-body">
          <div className="container-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
