/* ==========================================
   AEROCLUB APP - Frontend JS
   SPA con fetch API + CRUD completo
   ========================================== */

const API = '/api';

// ===================== UTILS =====================
const $ = id => document.getElementById(id);

function toast(msg, type = 'success') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  setTimeout(() => t.className = '', 3000);
}

async function api(path, options = {}) {
  try {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    toast(err.message, 'error');
    throw err;
  }
}

function badgeEstado(estado) {
  const map = {
    'Planificado':      'badge-blue',
    'En Vuelo':         'badge-amber',
    'Completado':       'badge-green',
    'Cancelado':        'badge-red',
    'Operativa':        'badge-green',
    'En Mantenimiento': 'badge-amber',
    'Baja':             'badge-red',
  };
  return `<span class="badge ${map[estado] || 'badge-gray'}">${estado}</span>`;
}

function badgeCategoria(cat) {
  const map = { PPL:'badge-blue', CPL:'badge-purple', ATPL:'badge-red', PVL:'badge-green' };
  return `<span class="badge ${map[cat] || 'badge-gray'}">${cat}</span>`;
}

function badgeRol(rol) {
  return rol === 'Instructor'
    ? `<span class="badge badge-amber">🎓 Instructor</span>`
    : `<span class="badge badge-gray">Piloto</span>`;
}

function formatDuracion(min) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ===================== STATS =====================
async function loadStats() {
  try {
    const { data } = await api('/vuelos/stats');
    $('stat-total').textContent       = data.total_vuelos;
    $('stat-en-vuelo').textContent    = data.en_vuelo;
    $('stat-completados').textContent = data.completados;
    $('stat-horas-hoy').textContent   = data.horas_hoy + 'h';
    $('stat-pilotos').textContent     = data.pilotos_activos;
    $('stat-aeronaves').textContent   = data.aeronaves_operativas;
  } catch (e) { /* silencioso */ }
}

// ===================== NAV =====================
let currentTab = 'vuelos';

function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('nav button').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-content').forEach(s =>
    s.style.display = 'none'
  );
  $(`tab-${tab}`).style.display = 'block';
  if (tab === 'vuelos')       loadVuelos();
  if (tab === 'pilotos')      loadPilotos();
  if (tab === 'instructores') loadInstructores();
  if (tab === 'aeronaves')    loadAeronaves();
}

// ===================== VUELOS =====================
async function loadVuelos() {
  try {
    const { data } = await api('/vuelos');
    const tbody = $('vuelos-tbody');
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="empty"><div class="icon">✈️</div>
        <p>No hay vuelos registrados</p>
        <button class="btn btn-primary" style="margin-top:12px" onclick="openVueloModal()">+ Registrar primer vuelo</button>
        </div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(v => `
      <tr>
        <td>
          <strong>${v.fecha}</strong><br>
          <small style="color:#64748b">${v.hora_despegue}${v.hora_aterrizaje ? ' → ' + v.hora_aterrizaje : ' →  en curso'}</small>
        </td>
        <td>${v.piloto_nombre}<br><small style="color:#64748b">${v.piloto_licencia}</small></td>
        <td><strong>${v.aeronave_matricula}</strong><br><small style="color:#64748b">${v.aeronave_descripcion}</small></td>
        <td>${v.origen} → ${v.destino}</td>
        <td>${v.tipo_vuelo}</td>
        <td>${v.tipo_vuelo === 'Instruccion' && v.instructor_nombre
          ? `${v.instructor_nombre}<br><small style="color:#64748b">${v.instructor_licencia || ''}</small>`
          : '—'}</td>
        <td>${formatDuracion(v.duracion_min)}</td>
        <td>${badgeEstado(v.estado)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm btn-primary" onclick="editVuelo(${v.id})" title="Editar">✏️</button>
          <button class="btn btn-sm btn-danger"  onclick="deleteVuelo(${v.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>`).join('');
  } catch (e) { /* manejado en api() */ }
}

function toggleInstructorVuelo() {
  const isInstruccion = $('v-tipo').value === 'Instruccion';
  $('instructor-vuelo-field').style.display = isInstruccion ? 'block' : 'none';
  if (!isInstruccion) $('v-instructor').value = '';
}

// Abrir modal nuevo vuelo — carga pilotos, aeronaves e instructores desde la API
async function openVueloModal(vuelo = null) {
  const modal = $('modal-vuelo');
  $('modal-vuelo-title').textContent = vuelo ? 'Editar Vuelo' : 'Nuevo Vuelo';
  $('form-vuelo').dataset.id = vuelo ? vuelo.id : '';

  $('v-piloto').innerHTML    = '<option value="">Cargando pilotos...</option>';
  $('v-aeronave').innerHTML  = '<option value="">Cargando aeronaves...</option>';
  $('v-instructor').innerHTML = '<option value="">Cargando instructores...</option>';
  modal.classList.add('open');

  try {
    const [pRes, aRes, iRes] = await Promise.all([
      api('/pilotos'),
      api('/aeronaves'),
      api('/pilotos/instructores')
    ]);

    $('v-piloto').innerHTML =
      '<option value="">— Seleccionar piloto —</option>' +
      pRes.data
        .filter(p => p.activo)
        .map(p => `<option value="${p.id}">${p.apellido}, ${p.nombre} (${p.categoria} · ${p.licencia})</option>`)
        .join('');

    $('v-aeronave').innerHTML =
      '<option value="">— Seleccionar aeronave —</option>' +
      aRes.data
        .filter(a => a.estado === 'Operativa')
        .map(a => `<option value="${a.id}">${a.matricula} · ${a.marca} ${a.modelo} (${a.tipo})</option>`)
        .join('');

    $('v-instructor').innerHTML =
      '<option value="">— Seleccionar instructor —</option>' +
      iRes.data
        .map(i => `<option value="${i.id}">${i.apellido}, ${i.nombre} (${i.licencia_instruccion || i.licencia})</option>`)
        .join('');

    if (vuelo) {
      $('v-piloto').value      = vuelo.piloto_id;
      $('v-aeronave').value    = vuelo.aeronave_id;
      $('v-fecha').value       = vuelo.fecha;
      $('v-despegue').value    = vuelo.hora_despegue;
      $('v-aterrizaje').value  = vuelo.hora_aterrizaje || '';
      $('v-duracion').value    = vuelo.duracion_min || '';
      $('v-origen').value      = vuelo.origen;
      $('v-destino').value     = vuelo.destino;
      $('v-tipo').value        = vuelo.tipo_vuelo;
      $('v-estado').value      = vuelo.estado;
      $('v-obs').value         = vuelo.observaciones || '';
      $('v-instructor').value  = vuelo.instructor_id || '';
    } else {
      $('form-vuelo').querySelectorAll('input, textarea').forEach(el => el.value = '');
      $('v-fecha').value  = new Date().toISOString().split('T')[0];
      $('v-tipo').value   = 'Local';
      $('v-estado').value = 'Planificado';
      $('v-instructor').value = '';
    }
    toggleInstructorVuelo();
  } catch (e) {
    modal.classList.remove('open');
  }
}

async function editVuelo(id) {
  try {
    const { data } = await api(`/vuelos/${id}`);
    openVueloModal(data);
  } catch (e) { /* manejado en api() */ }
}

async function deleteVuelo(id) {
  if (!confirm('¿Confirmar eliminación del vuelo?')) return;
  try {
    await api(`/vuelos/${id}`, { method: 'DELETE' });
    toast('Vuelo eliminado');
    loadVuelos();
    loadStats();
  } catch (e) { /* manejado */ }
}

async function saveVuelo() {
  const id = $('form-vuelo').dataset.id;

  // Validación frontend
  const piloto_id   = $('v-piloto').value;
  const aeronave_id = $('v-aeronave').value;
  const fecha       = $('v-fecha').value;
  const despegue    = $('v-despegue').value;
  const origen      = $('v-origen').value.trim();
  const destino     = $('v-destino').value.trim();

  const tipo_vuelo   = $('v-tipo').value;
  const instructor_id = $('v-instructor').value;

  if (!piloto_id)    { toast('Seleccioná un piloto', 'error');      $('v-piloto').focus();    return; }
  if (!aeronave_id)  { toast('Seleccioná una aeronave', 'error');   $('v-aeronave').focus();  return; }
  if (!fecha)        { toast('Ingresá la fecha', 'error');          $('v-fecha').focus();     return; }
  if (!despegue)     { toast('Ingresá hora de despegue', 'error');  $('v-despegue').focus();  return; }
  if (!origen)       { toast('Ingresá el origen', 'error');         $('v-origen').focus();    return; }
  if (!destino)      { toast('Ingresá el destino', 'error');        $('v-destino').focus();   return; }
  if (tipo_vuelo === 'Instruccion' && !instructor_id) {
    toast('Seleccioná un instructor a cargo', 'error');
    $('v-instructor').focus();
    return;
  }

  // Calcular duración automáticamente si hay hora aterrizaje
  const aterrizaje  = $('v-aterrizaje').value;
  let duracion_min  = $('v-duracion').value ? +$('v-duracion').value : null;
  if (aterrizaje && despegue && !duracion_min) {
    const [dh, dm] = despegue.split(':').map(Number);
    const [ah, am] = aterrizaje.split(':').map(Number);
    const diff = (ah * 60 + am) - (dh * 60 + dm);
    if (diff > 0) duracion_min = diff;
  }

  const body = {
    piloto_id:       +piloto_id,
    aeronave_id:     +aeronave_id,
    fecha,
    hora_despegue:   despegue,
    hora_aterrizaje: aterrizaje || null,
    duracion_min,
    origen,
    destino,
    tipo_vuelo,
    estado:          $('v-estado').value,
    observaciones:   $('v-obs').value.trim() || null,
    instructor_id:   instructor_id ? +instructor_id : null,
  };

  try {
    if (id) {
      await api(`/vuelos/${id}`, { method: 'PUT', body });
      toast('✈️ Vuelo actualizado');
    } else {
      await api('/vuelos', { method: 'POST', body });
      toast('✈️ Vuelo registrado');
    }
    $('modal-vuelo').classList.remove('open');
    loadVuelos();
    loadStats();
  } catch (e) { /* manejado */ }
}

// ===================== PILOTOS =====================
async function loadPilotos() {
  try {
    const { data } = await api('/pilotos');
    const tbody = $('pilotos-tbody');
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="empty"><div class="icon">👨‍✈️</div>
        <p>No hay pilotos registrados</p>
        <button class="btn btn-primary" style="margin-top:12px" onclick="openPilotoModal()">+ Agregar primer piloto</button>
        </div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(p => `
      <tr>
        <td><strong>${p.apellido}, ${p.nombre}</strong></td>
        <td>${p.dni}</td>
        <td>${p.licencia}</td>
        <td>${badgeCategoria(p.categoria)}</td>
        <td>${badgeRol(p.rol || 'Piloto')}</td>
        <td>${(+p.horas_vuelo).toFixed(1)} hs</td>
        <td>${p.email || '—'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm btn-primary" onclick="editPiloto(${p.id})" title="Editar">✏️</button>
          <button class="btn btn-sm btn-danger"  onclick="deletePiloto(${p.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>`).join('');
  } catch (e) { /* manejado */ }
}

function toggleInstructorFields() {
  const isInstructor = $('p-rol').value === 'Instructor';
  $('instructor-fields').style.display = isInstructor ? 'block' : 'none';
}

function openPilotoModal(p = null, forceInstructor = false) {
  $('modal-piloto-title').textContent = p ? 'Editar Piloto' : 'Nuevo Piloto';
  $('form-piloto').dataset.id = p ? p.id : '';

  if (p) {
    $('p-nombre').value    = p.nombre;
    $('p-apellido').value  = p.apellido;
    $('p-dni').value       = p.dni;
    $('p-licencia').value  = p.licencia;
    $('p-categoria').value = p.categoria;
    $('p-horas').value     = p.horas_vuelo;
    $('p-email').value     = p.email || '';
    $('p-tel').value       = p.telefono || '';
    $('p-rol').value       = p.rol || 'Piloto';
    $('p-lic-inst').value  = p.licencia_instruccion || '';
    // Restaurar especialidades seleccionadas
    const esp = (p.especialidades || '').split(',').map(s => s.trim()).filter(Boolean);
    Array.from($('p-especialidades').options).forEach(opt => {
      opt.selected = esp.includes(opt.value);
    });
  } else {
    $('form-piloto').querySelectorAll('input').forEach(el => el.value = '');
    $('p-categoria').value = 'PPL';
    $('p-horas').value     = '0';
    $('p-rol').value       = forceInstructor ? 'Instructor' : 'Piloto';
    $('p-lic-inst').value  = '';
    Array.from($('p-especialidades').options).forEach(opt => opt.selected = false);
  }
  toggleInstructorFields();
  $('modal-piloto').classList.add('open');
  $('p-nombre').focus();
}

async function editPiloto(id) {
  try {
    const { data } = await api(`/pilotos/${id}`);
    openPilotoModal(data);
  } catch (e) { /* manejado */ }
}

async function deletePiloto(id) {
  if (!confirm('¿Confirmar eliminación del piloto?')) return;
  try {
    await api(`/pilotos/${id}`, { method: 'DELETE' });
    toast('Piloto eliminado');
    loadPilotos();
    loadStats();
  } catch (e) { /* manejado */ }
}

async function savePiloto() {
  const id = $('form-piloto').dataset.id;

  const nombre    = $('p-nombre').value.trim();
  const apellido  = $('p-apellido').value.trim();
  const dni       = $('p-dni').value.trim();
  const licencia  = $('p-licencia').value.trim();
  const categoria = $('p-categoria').value;
  const rol       = $('p-rol').value;
  const licencia_instruccion = $('p-lic-inst').value.trim();
  const especialidades = Array.from($('p-especialidades').selectedOptions)
    .map(o => o.value).join(', ');

  if (!nombre)   { toast('Ingresá el nombre', 'error');    $('p-nombre').focus();   return; }
  if (!apellido) { toast('Ingresá el apellido', 'error');  $('p-apellido').focus(); return; }
  if (!dni)      { toast('Ingresá el DNI', 'error');       $('p-dni').focus();      return; }
  if (!licencia) { toast('Ingresá la licencia', 'error');  $('p-licencia').focus(); return; }
  if (rol === 'Instructor' && !licencia_instruccion) {
    toast('Ingresá la licencia de instrucción', 'error');
    $('p-lic-inst').focus();
    return;
  }

  const body = {
    nombre, apellido, dni, licencia, categoria,
    horas_vuelo: +$('p-horas').value || 0,
    email:       $('p-email').value.trim() || null,
    telefono:    $('p-tel').value.trim()   || null,
    activo:      1,
    rol,
    licencia_instruccion: licencia_instruccion || null,
    especialidades:       especialidades       || null
  };

  try {
    if (id) {
      await api(`/pilotos/${id}`, { method: 'PUT', body });
      toast(rol === 'Instructor' ? '🎓 Instructor actualizado' : '👨‍✈️ Piloto actualizado');
    } else {
      await api('/pilotos', { method: 'POST', body });
      toast(rol === 'Instructor' ? '🎓 Instructor registrado' : '👨‍✈️ Piloto registrado');
    }
    $('modal-piloto').classList.remove('open');
    loadPilotos();
    if (currentTab === 'instructores') loadInstructores();
    loadStats();
  } catch (e) { /* manejado */ }
}

// ===================== INSTRUCTORES =====================
async function loadInstructores() {
  try {
    const { data } = await api('/pilotos/instructores');
    const tbody = $('instructores-tbody');
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="9">
        <div class="empty"><div class="icon">🎓</div>
        <p>No hay instructores registrados</p>
        <button class="btn btn-primary" style="margin-top:12px" onclick="openPilotoModal(null, true)">+ Agregar primer instructor</button>
        </div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(p => `
      <tr>
        <td><strong>${p.apellido}, ${p.nombre}</strong></td>
        <td>${p.dni}</td>
        <td>${p.licencia}</td>
        <td>${badgeCategoria(p.categoria)}</td>
        <td><strong>${p.licencia_instruccion || '—'}</strong></td>
        <td>${p.especialidades ? p.especialidades.split(',').map(e =>
          `<span class="badge badge-blue" style="margin:1px">${e.trim()}</span>`
        ).join(' ') : '—'}</td>
        <td>${(+p.horas_vuelo).toFixed(1)} hs</td>
        <td>
          ${p.email    ? `<small>${p.email}</small><br>` : ''}
          ${p.telefono ? `<small style="color:#64748b">${p.telefono}</small>` : (!p.email ? '—' : '')}
        </td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm btn-primary" onclick="editPiloto(${p.id})" title="Editar">✏️</button>
          <button class="btn btn-sm btn-danger"  onclick="deletePiloto(${p.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>`).join('');
  } catch (e) { /* manejado */ }
}

// ===================== AERONAVES =====================
async function loadAeronaves() {
  try {
    const { data } = await api('/aeronaves');
    const tbody = $('aeronaves-tbody');
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="empty"><div class="icon">🛩️</div>
        <p>No hay aeronaves registradas</p>
        <button class="btn btn-primary" style="margin-top:12px" onclick="openAeronaveModal()">+ Agregar primera aeronave</button>
        </div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(a => `
      <tr>
        <td><strong>${a.matricula}</strong></td>
        <td>${a.marca} ${a.modelo}</td>
        <td>${a.tipo}</td>
        <td>${a.motor || '—'}</td>
        <td>${a.año || '—'}</td>
        <td>${(+a.horas_totales).toFixed(1)} hs</td>
        <td>${badgeEstado(a.estado)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm btn-primary" onclick="editAeronave(${a.id})" title="Editar">✏️</button>
          <button class="btn btn-sm btn-danger"  onclick="deleteAeronave(${a.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>`).join('');
  } catch (e) { /* manejado */ }
}

function openAeronaveModal(a = null) {
  $('modal-aeronave-title').textContent = a ? 'Editar Aeronave' : 'Nueva Aeronave';
  $('form-aeronave').dataset.id = a ? a.id : '';

  if (a) {
    $('a-matricula').value = a.matricula;
    $('a-marca').value     = a.marca;
    $('a-modelo').value    = a.modelo;
    $('a-tipo').value      = a.tipo;
    $('a-motor').value     = a.motor || '';
    $('a-año').value       = a.año   || '';
    $('a-estado').value    = a.estado;
    $('a-horas').value     = a.horas_totales;
  } else {
    $('form-aeronave').querySelectorAll('input').forEach(el => el.value = '');
    $('a-tipo').value   = 'Avion';
    $('a-estado').value = 'Operativa';
    $('a-horas').value  = '0';
  }
  $('modal-aeronave').classList.add('open');
  $('a-matricula').focus();
}

async function editAeronave(id) {
  try {
    const { data } = await api(`/aeronaves/${id}`);
    openAeronaveModal(data);
  } catch (e) { /* manejado */ }
}

async function deleteAeronave(id) {
  if (!confirm('¿Confirmar eliminación de la aeronave?')) return;
  try {
    await api(`/aeronaves/${id}`, { method: 'DELETE' });
    toast('Aeronave eliminada');
    loadAeronaves();
    loadStats();
  } catch (e) { /* manejado */ }
}

async function saveAeronave() {
  const id = $('form-aeronave').dataset.id;

  const matricula = $('a-matricula').value.trim().toUpperCase();
  const marca     = $('a-marca').value.trim();
  const modelo    = $('a-modelo').value.trim();
  const tipo      = $('a-tipo').value;

  if (!matricula) { toast('Ingresá la matrícula', 'error'); $('a-matricula').focus(); return; }
  if (!marca)     { toast('Ingresá la marca', 'error');     $('a-marca').focus();     return; }
  if (!modelo)    { toast('Ingresá el modelo', 'error');    $('a-modelo').focus();    return; }

  const body = {
    matricula, marca, modelo, tipo,
    motor:        $('a-motor').value.trim()  || null,
    año:          $('a-año').value           ? +$('a-año').value : null,
    estado:       $('a-estado').value,
    horas_totales: +$('a-horas').value       || 0
  };

  try {
    if (id) {
      await api(`/aeronaves/${id}`, { method: 'PUT', body });
      toast('🛩️ Aeronave actualizada');
    } else {
      await api('/aeronaves', { method: 'POST', body });
      toast('🛩️ Aeronave registrada');
    }
    $('modal-aeronave').classList.remove('open');
    loadAeronaves();
    loadStats();
  } catch (e) { /* manejado */ }
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  setTab('vuelos');

  // Cerrar modales al hacer click fuera del contenido
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // Cerrar modales con ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m =>
        m.classList.remove('open')
      );
    }
  });
});
