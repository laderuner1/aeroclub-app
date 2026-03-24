export async function apiFetch(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body != null ? JSON.stringify(options.body) : undefined
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Error del servidor')
  return data
}
