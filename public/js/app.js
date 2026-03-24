/* ==========================================
   AEROCLUB APP - Frontend JS
   SPA con fetch API + CRUD completo
   ========================================== */

const API = '/api';

// ===================== UTILS =====================
const $ = id => document.getElementById(id);
const q = sel => document.querySelector(sel);

function toast(msg, type = 'success') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  setTimeout(() => t.className = '', 3000);
}

async function api(path, options = {}) {
  try {
    const r = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await r.json();
    if (!data.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    toast(err.message, 'error');
    throw err;
  }
}

function badgeEstado(estado) {
  const map = {
    'Planificado': 'badge-blue',
    'En Vuelo':    'badge-amber',
    'Completado':  'badge-green',
    'Cancelado':   'badge-red',
    'Operativa':   'badge-green',
    'En Mantenimiento': 'badge-amber',
    'Baja':        'badge-red',
  };
  return `<span class="badge ${map[estado] || 'badge-gray'}">${estado}</span>`;
}

function badgeCategoria(cat) {
  const map = { PPL:'badge-blue', CPL:'badge-purple', ATPL:'badge-red', PVL:'badge-green' };
  return `<span class="badge ${map[cat] || 'badge-gray'}">${cat}</span>`;
}

// ===================== STATS =====================
async function loadStats() {
  const { data } = await api('/vuelos/stats');
  $('stat-total').textContent      = data.total_vuelos;
  $('stat-en-vuelo').textContent   = data.en_vuelo;
  $('stat-completados').textContent= data.completados;
  $('stat-horas-hoy').textContent  = data.horas_hoy + 'h';
  $('stat-pilotos').textContent    = data.pilotos_activos;
  $('stat-aeronaves').textContent  = data.aeronaves_operativas;
}

// ===================== NAV =====================
let currentTab = 'vuelos';

function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(s => s.style.display = 'none');
  $(`tab-${tab}`).style.display = 'block';
  if (tab === 'vuelos')   loadVuelos();
  if (tab === 'pilotos')  loadPilotos();
  if (tab === 'aeronaves') loadAeronaves();
}

// ===================== VUELOS =====================
let pilotos_cache = [], aeronaves_cache = [];

async function loadVuelos() {
  const [vRes, pRes, aRes] = await Promise.all([
    api('/vuelos'), api('/pilotos'), api('/aeronaves')
  ]);
  pilotos_cache   = pRes.data;
  aeronaves_cache = aRes.data;

  const tbody = $('vuelos-tbody');
  if (!vRes.data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty"><div class="icon">✈️</div><p>No hay vuelos registrados</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = vRes.data.map(v => `
    <tr>
      <td><strong>${v.fecha}</strong><br><small class="muted">${v.hora_despegue}${v.hora_aterrizaje ? ' → ' + v.hora_aterrizaje : ''}</small></td>
      <td>${v.piloto_nombre}</td>
      <td><strong>${v.aeronave_matricula}</strong><br><small>${v.aeronave_descripcion}</small></td>
      <td>${v.origen} → ${v.destino}</td>
      <td>${v.tipo_vuelo}</td>
      <td>${v.duracion_min ? Math.floor(v.duracion_min/60)+'h '+(v.duracion_min%60)+'m' : '—'}</td>
      <td>${badgeEstado(v.estado)}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="editVuelo(${v.id})">✏️</button>
        <button class="btn btn-sm btn-danger"  onclick="deleteVuelo(${v.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openVueloModal(vuelo = null) {
  const modal = $('modal-vuelo');
  const form  = $('form-vuelo');
  $('modal-vuelo-title').textContent = vuelo ? 'Editar Vuelo' : 'Nuevo Vuelo';

  // Llenar selects
  const ps = $('v-piloto');
  ps.innerHTML = '<option value="">Seleccionar piloto...</option>' +
    pilotos_cache.map(p => `<option value="${p.id}">${p.apellido}, ${p.nombre} (${p.licencia})</option>`).join('');

  const as = $('v-aeronave');
  as.innerHTML = '<option value="">Seleccionar aeronave...</option>' +
    aeronaves_cache.filter(a => a.estado === 'Operativa').map(a => `<option value="${a.id}">${a.matricula} - ${a.marca} ${a.modelo}</option>`).join('');

  if (vuelo) {
    form.dataset.id       = vuelo.id;
    $('v-piloto').value   = vuelo.piloto_id;
    $('v-aeronave').value = vuelo.aeronave_id;
    $('v-fecha').value    = vuelo.fecha;
    $('v-despegue').value = vuelo.hora_despegue;
    $('v-aterrizaje').value = vuelo.hora_aterrizaje || '';
    $('v-duracion').value = vuelo.duracion_min || '';
    $('v-origen').value   = vuelo.origen;
    $('v-destino').value  = vuelo.destino;
    $('v-tipo').value     = vuelo.tipo_vuelo;
    $('v-estado').value   = vuelo.estado;
    $('v-obs').value      = vuelo.observaciones || '';
  } else {
    form.dataset.id = '';
    form.reset();
    $('v-fecha').value = new Date().toISOString().split('T')[0];
  }
  modal.classList.add('open');
}

async function editVuelo(id) {
  const { data } = await api(`/vuelos/${id}`);
  openVueloModal(data);
}

async function deleteVuelo(id) {
  if (!confirm('¿Eliminar este vuelo?')) return;
  await api(`/vuelos/${id}`, { method: 'DELETE' });
  toast('Vuelo eliminado');
  loadVuelos(); loadStats();
}

async function saveVuelo() {
  const form = $('form-vuelo');
  const id   = form.dataset.id;
  const body = {
    piloto_id:       +$('v-piloto').value,
    aeronave_id:     +$('v-aeronave').value,
    fecha:           $('v-fecha').value,
    hora_despegue:   $('v-despegue').value,
    hora_aterrizaje: $('v-aterrizaje').value || null,
    duracion_min:    $('v-duracion').value ? +$('v-duracion').value : null,
    origen:          $('v-origen').value,
    destino:         $('v-destino').value,
    tipo_vuelo:      $('v-tipo').value,
    estado:          $('v-estado').value,
    observaciones:   $('v-obs').value || null,
  };
  if (id) {
    await api(`/vuelos/${id}`, { method: 'PUT', body });
    toast('Vuelo actualizado ✈️');
  } else {
    await api('/vuelos', { method: 'POST', body });
    toast('Vuelo registrado ✈️');
  }
  $('modal-vuelo').classList.remove('open');
  loadVuelos(); loadStats();
}

// ===================== PILOTOS =====================
async function loadPilotos() {
  const { data } = await api('/pilotos');
  const tbody = $('pilotos-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="icon">👨‍✈️</div><p>No hay pilotos registrados</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${p.apellido}, ${p.nombre}</strong></td>
      <td>${p.dni}</td>
      <td>${p.licencia}</td>
      <td>${badgeCategoria(p.categoria)}</td>
      <td>${p.horas_vuelo.toFixed(1)} hs</td>
      <td>${p.email || '—'}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="editPiloto(${p.id})">✏️</button>
        <button class="btn btn-sm btn-danger"  onclick="deletePiloto(${p.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openPilotoModal(p = null) {
  $('modal-piloto-title').textContent = p ? 'Editar Piloto' : 'Nuevo Piloto';
  const form = $('form-piloto');
  if (p) {
    form.dataset.id       = p.id;
    $('p-nombre').value   = p.nombre;
    $('p-apellido').value = p.apellido;
    $('p-dni').value      = p.dni;
    $('p-licencia').value = p.licencia;
    $('p-categoria').value= p.categoria;
    $('p-horas').value    = p.horas_vuelo;
    $('p-email').value    = p.email || '';
    $('p-tel').value      = p.telefono || '';
  } else {
    form.dataset.id = '';
    form.reset();
  }
  $('modal-piloto').classList.add('open');
}

async function editPiloto(id) {
  const { data } = await api(`/pilotos/${id}`);
  openPilotoModal(data);
}

async function deletePiloto(id) {
  if (!confirm('¿Eliminar este piloto?')) return;
  await api(`/pilotos/${id}`, { method: 'DELETE' });
  toast('Piloto eliminado');
  loadPilotos();
}

async function savePiloto() {
  const form = $('form-piloto');
  const id   = form.dataset.id;
  const body = {
    nombre: $('p-nombre').value, apellido: $('p-apellido').value,
    dni: $('p-dni').value, licencia: $('p-licencia').value,
    categoria: $('p-categoria').value, horas_vuelo: +$('p-horas').value,
    email: $('p-email').value || null, telefono: $('p-tel').value || null, activo: 1
  };
  if (id) {
    await api(`/pilotos/${id}`, { method: 'PUT', body });
    toast('Piloto actualizado 👨‍✈️');
  } else {
    await api('/pilotos', { method: 'POST', body });
    toast('Piloto registrado 👨‍✈️');
  }
  $('modal-piloto').classList.remove('open');
  loadPilotos(); loadStats();
}

// ===================== AERONAVES =====================
async function loadAeronaves() {
  const { data } = await api('/aeronaves');
  const tbody = $('aeronaves-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="icon">🛩️</div><p>No hay aeronaves registradas</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(a => `
    <tr>
      <td><strong>${a.matricula}</strong></td>
      <td>${a.marca} ${a.modelo}</td>
      <td>${a.tipo}</td>
      <td>${a.motor || '—'}</td>
      <td>${a.año || '—'}</td>
      <td>${a.horas_totales.toFixed(1)} hs</td>
      <td>${badgeEstado(a.estado)}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="editAeronave(${a.id})">✏️</button>
        <button class="btn btn-sm btn-danger"  onclick="deleteAeronave(${a.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openAeronaveModal(a = null) {
  $('modal-aeronave-title').textContent = a ? 'Editar Aeronave' : 'Nueva Aeronave';
  const form = $('form-aeronave');
  if (a) {
    form.dataset.id       = a.id;
    $('a-matricula').value= a.matricula;
    $('a-marca').value    = a.marca;
    $('a-modelo').value   = a.modelo;
    $('a-tipo').value     = a.tipo;
    $('a-motor').value    = a.motor || '';
    $('a-año').value      = a.año || '';
    $('a-estado').value   = a.estado;
    $('a-horas').value    = a.horas_totales;
  } else {
    form.dataset.id = '';
    form.reset();
    $('a-estado').value = 'Operativa';
  }
  $('modal-aeronave').classList.add('open');
}

async function editAeronave(id) {
  const { data } = await api(`/aeronaves/${id}`);
  openAeronaveModal(data);
}

async function deleteAeronave(id) {
  if (!confirm('¿Eliminar esta aeronave?')) return;
  await api(`/aeronaves/${id}`, { method: 'DELETE' });
  toast('Aeronave eliminada');
  loadAeronaves(); loadStats();
}

async function saveAeronave() {
  const form = $('form-aeronave');
  const id   = form.dataset.id;
  const body = {
    matricula: $('a-matricula').value, marca: $('a-marca').value,
    modelo: $('a-modelo').value, tipo: $('a-tipo').value,
    motor: $('a-motor').value || null, año: $('a-año').value ? +$('a-año').value : null,
    estado: $('a-estado').value, horas_totales: +$('a-horas').value
  };
  if (id) {
    await api(`/aeronaves/${id}`, { method: 'PUT', body });
    toast('Aeronave actualizada 🛩️');
  } else {
    await api('/aeronaves', { method: 'POST', body });
    toast('Aeronave registrada 🛩️');
  }
  $('modal-aeronave').classList.remove('open');
  loadAeronaves(); loadStats();
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  setTab('vuelos');

  // Cerrar modales al click fuera
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
});
