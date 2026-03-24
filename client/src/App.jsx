import { useState, useCallback } from 'react'
import Layout from './components/Layout.jsx'
import StatsGrid from './components/StatsGrid.jsx'
import Vuelos from './pages/Vuelos.jsx'
import Pilotos from './pages/Pilotos.jsx'
import Instructores from './pages/Instructores.jsx'
import Aeronaves from './pages/Aeronaves.jsx'

const TABS = [
  { id: 'vuelos',       label: 'Vuelos',       icon: '✈️' },
  { id: 'pilotos',      label: 'Pilotos',      icon: '👨‍✈️' },
  { id: 'instructores', label: 'Instructores', icon: '🎓' },
  { id: 'aeronaves',    label: 'Aeronaves',    icon: '🛩️' },
]

export default function App() {
  const [tab, setTab]     = useState('vuelos')
  const [toast, setToast] = useState(null)
  const [statsKey, setStatsKey] = useState(0)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const refreshStats = useCallback(() => setStatsKey(k => k + 1), [])

  const pageProps = { toast: showToast, onSave: refreshStats }

  return (
    <>
      <Layout tab={tab} setTab={setTab} tabs={TABS}>
        <StatsGrid key={statsKey} />
        {tab === 'vuelos'       && <Vuelos       {...pageProps} />}
        {tab === 'pilotos'      && <Pilotos      {...pageProps} />}
        {tab === 'instructores' && <Instructores {...pageProps} />}
        {tab === 'aeronaves'    && <Aeronaves    {...pageProps} />}
      </Layout>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#d63939' : '#2fb344',
          color: 'white', padding: '12px 20px', borderRadius: 8,
          fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,.4)',
          fontSize: '.9rem', maxWidth: 320, lineHeight: 1.4
        }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
