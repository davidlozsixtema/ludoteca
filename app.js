/* Mi Ludoteca - app estatica.
   Datos: juegos.json e imagenes/ servidos junto a la app (GitHub Pages).
   Los cambios hechos aqui se guardan en localStorage (cola), se aplican
   en memoria y se descargan como cambios.json para subirlos al PC. */
'use strict';

const sel = id => document.getElementById(id);
const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
  '<rect width="400" height="300" fill="#f2f2f2"/>' +
  '<text x="200" y="160" font-size="80" text-anchor="middle" fill="#bbb">🎲</text></svg>');

let datos = null;          // juegos.json entero
let cards = [];            // elementos .juego ya creados
let ubicacionDe = {};      // juego_id -> "Nombre · Balda N"
let pagina = 0, aleatorio = null;
// coleccion real = fuera deseados, en camino, otra ludoteca y fuera de coleccion
const coleccion = () =>
  datos.juegos.filter(j => !(j.deseado || j.en_camino || j.otra_ludoteca || j.fuera_coleccion));

/* ==================== descarga de datos ==================== */

async function cargarDatos() {
  // 1) fichero local
  try {
    const r = await fetch('juegos.json', { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      localStorage.setItem('datos-cache', JSON.stringify(d));
      return d;
    }
  } catch { /* offline */ }
  // 2) ultima cache guardada
  const cache = localStorage.getItem('datos-cache');
  if (cache) return JSON.parse(cache);
  throw new Error('Sin datos: no hay juegos.json ni cache.');
}

function urlImagen(nombre) {
  return nombre ? `imagenes/${nombre}` : PLACEHOLDER;
}

/* ==================== cola de cambios local ====================
   Ediciones del movil: persisten en localStorage y se aplican en
   memoria sobre juegos.json. El banner permite descargar cambios.json,
   que 'Aplicar cambios.py' (en el PC) vuelca en la BD via la API. */

let datosBase = null;    // juegos.json tal cual llego
let cola = { base: null, cambios: [] };
let editando = null;     // juego en el editor (null = alta)

const cargarCola = () => {
  try { return JSON.parse(localStorage.getItem('ludoteca.cola')) || { base: null, cambios: [] }; }
  catch { return { base: null, cambios: [] }; }
};
const guardarCola = () =>
  localStorage.setItem('ludoteca.cola', JSON.stringify(cola));

// aplica la cola sobre una copia limpia de los datos descargados
function aplicarCola() {
  datos = JSON.parse(JSON.stringify(datosBase));
  cola.cambios.forEach(op => {
    if (op.tipo === 'alta') {
      const j = { id: op.tmp_id, expansiones: [], padre: null,
                  expansion_de: null, imagen: null, ...op.campos };
      datos.juegos.push(j);
      ponerEnBalda(j, op.ubicacion);
    } else {
      const j = datos.juegos.find(x => x.id === op.juego_id);
      if (!j) return;                          // el juego ya no existe
      Object.assign(j, op.campos);
      if (op.ubicacion === 'quitar') quitarDeBalda(j);
      else if (op.ubicacion) { quitarDeBalda(j); ponerEnBalda(j, op.ubicacion); }
    }
  });
}

const baldaDe = id =>
  datos.ubicaciones.find(u => u.juegos.some(x => x.id === id));

function quitarDeBalda(j) {
  const u = baldaDe(j.id);
  if (u) u.juegos = u.juegos.filter(x => x.id !== j.id);
}
function ponerEnBalda(j, ubi) {
  if (!ubi) return;
  const u = datos.ubicaciones.find(x =>
    x.nombre_ubicacion === ubi.mueble && x.numero_balda === ubi.balda);
  if (u) u.juegos.push({ id: j.id, nombre: j.nombre,
                         imagen: j.imagen, expansion_de: j.expansion_de });
}

/* ==================== tarjetas ==================== */

const CAT = {}, MEC = {}, TEM = {};
const rangoTxt = txt => {
  const m = (txt || '').match(/\d+/g);          // "2-4" -> [2,4]; "4" -> [4,4]
  if (!m) return null;
  const a = +m[0], b = m[1] ? +m[1] : a;
  return [Math.min(a, b), Math.max(a, b)];
};
const rangoCorto = txt => {                     // "60-60" -> "60"
  const m = (txt || '').match(/^\s*(\d+)\s*[-–]\s*(\d+)\s*$/);
  return m && m[1] === m[2] ? m[1] : txt;
};

function construir() {
  datos.categorias.forEach(c => CAT[c.id] = c.valor);
  datos.mecanicas.forEach(m => MEC[m.id] = m.valor);
  datos.tematicas.forEach(t => TEM[t.id] = t.valor);

  ubicacionDe = {};
  datos.ubicaciones.forEach(u =>
    u.juegos.forEach(j => {
      ubicacionDe[j.id] = `${u.nombre_ubicacion} · balda ${u.numero_balda}`;
    }));

  const rejilla = sel('rejilla');
  rejilla.innerHTML = '';
  cards = datos.juegos.map(j => {
    const d = document.createElement('div');
    d.className = 'card juego';
    Object.assign(d.dataset, {
      id: j.id, nombre: j.nombre.toLowerCase(),
      cat: j.categoria_id || '', mec: j.mecanica_id || '', tem: j.tematica_id || '',
      jug: j.jugadores || '', edad: j.edad || '', dur: j.duracion || '',
      pub: j.publicacion || '', des: j.deseado ? '1' : '', cam: j.en_camino ? '1' : '',
      pre: j.prestado ? '1' : '', otr: j.otra_ludoteca ? '1' : '',
      fue: j.fuera_coleccion ? '1' : '', img: j.imagen || '',
      ubi: ubicacionDe[j.id] ? '1' : '',
    });
    // estados disjuntos: un solo icono arriba a la izquierda
    const badge =
      j.deseado ? '<span class="badge" title="Lista de deseos">❤️</span>' :
      j.en_camino ? '<span class="badge" title="En camino">🚚</span>' :
      j.otra_ludoteca ? '<span class="badge" title="De otra ludoteca">📤</span>' :
      j.fuera_coleccion ? '<span class="badge" title="Fuera de la coleccion">📦</span>' :
      j.prestado ? '<span class="badge" title="Prestado">🤝</span>' : '';
    const chips = [CAT[j.categoria_id], MEC[j.mecanica_id], TEM[j.tematica_id]]
      .filter(Boolean).map(v => `<span class="chip">${v}</span>`).join('');
    const meta = [
      j.jugadores ? `👥 ${rangoCorto(j.jugadores)}` : '',
      j.duracion ? `⏱️ ${rangoCorto(j.duracion)} min` : '',
      j.edad ? `🧒 ${j.edad}` : '',
      j.publicacion ? `📅 ${j.publicacion}` : '',
    ].filter(Boolean).join(' · ');
    const ubi = ubicacionDe[j.id]
      ? `<div class="ubi">📍 ${ubicacionDe[j.id]}</div>` : '';
    // expansiones: la expansion muestra el thumb de su juego base;
    // el juego base muestra los thumbs de sus expansiones (max 3 + "+N")
    const miniExp = (m, titulo) =>
      `<img class="th" loading="lazy" alt="" data-nom="${m.nombre.replace(/"/g, '&quot;')}"
          title="${titulo}: ${m.nombre.replace(/"/g, '&quot;')}"
          src="${urlImagen(m.imagen)}" onerror="this.remove()">`;
    let exp = '';
    if (j.padre)
      exp = `<div class="exp" title="Expansion">${miniExp(j.padre, 'Expansion de')}</div>`;
    else if (j.expansiones && j.expansiones.length) {
      const extra = j.expansiones.length - 3;
      exp = `<div class="exp" title="Expansiones: ${j.expansiones.map(e => e.nombre).join(', ')}">` +
        j.expansiones.slice(0, 3).map(e => miniExp(e, 'Expansion')).join('') +
        (extra > 0 ? `<span class="mas">+${extra}</span>` : '') + '</div>';
    }
    d.innerHTML =
      `${badge}${exp}<img loading="lazy" alt="" src="${urlImagen(j.imagen)}"
          onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
       <div class="cuerpo"><h3>${j.nombre}</h3>
        <div class="chips">${chips}</div>
        <div class="meta">${meta}</div>${ubi}</div>`;
    const be = document.createElement('button');
    be.className = 'edit'; be.title = 'Editar'; be.textContent = '✏️';
    be.onclick = () => abrirEditor(j);
    d.appendChild(be);
    rejilla.appendChild(d);
    return d;
  });
}

/* ==================== filtros / orden ==================== */

function pasa(c) {
  const t = sel('f-buscar').value.toLowerCase();
  if (t && !c.dataset.nombre.includes(t)) return false;
  const fc = sel('f-cat').value;
  if (fc && (fc === 'sin' ? c.dataset.cat !== '' : c.dataset.cat !== fc)) return false;
  const fm = sel('f-mec').value;
  if (fm && (fm === 'sin' ? c.dataset.mec !== '' : c.dataset.mec !== fm)) return false;
  const ft = sel('f-tem').value;
  if (ft && (ft === 'sin' ? c.dataset.tem !== '' : c.dataset.tem !== ft)) return false;
  if (sel('f-foto').checked && c.dataset.img) return false;
  // sin ubicar = juego fisico propio sin balda (fuera prestado/deseado/etc.)
  if (sel('f-ubi').checked &&
      (c.dataset.ubi || c.dataset.des || c.dataset.cam || c.dataset.otr ||
       c.dataset.pre || c.dataset.fue)) return false;
  const n = parseInt(sel('f-jug').value);
  if (!isNaN(n)) {
    const r = rangoTxt(c.dataset.jug);
    if (!r || n < r[0] || n > r[1]) return false;
  }
  const d = parseInt(sel('f-dur').value);
  if (!isNaN(d)) {
    const r = rangoTxt(c.dataset.dur);
    if (!r || d < r[0] || d > r[1]) return false;
  }
  if (sel('f-edad').value && c.dataset.edad !== sel('f-edad').value) return false;
  const w = sel('f-col').value;
  if (w === 'propietario' && (c.dataset.des || c.dataset.cam || c.dataset.otr || c.dataset.pre || c.dataset.fue)) return false;
  if (w === 'otra' && c.dataset.otr !== '1') return false;
  if (w === 'camino' && c.dataset.cam !== '1') return false;
  if (w === 'deseado' && c.dataset.des !== '1') return false;
  if (w === 'prestado' && c.dataset.pre !== '1') return false;
  if (w === 'fuera' && c.dataset.fue !== '1') return false;
  return true;
}

function ordenar() {
  const anyo = c => parseInt(c.dataset.pub) || 0;
  const dur = c => (rangoTxt(c.dataset.dur) || [0])[0];
  const cmp = {
    '': (a, b) => (a._rnd ??= Math.random()) - (b._rnd ??= Math.random()),
    'nombre-asc': (a, b) => a.dataset.nombre.localeCompare(b.dataset.nombre, 'es'),
    'nombre-desc': (a, b) => b.dataset.nombre.localeCompare(a.dataset.nombre, 'es'),
    'pub-desc': (a, b) => (anyo(b) || -1) - (anyo(a) || -1),
    'pub-asc': (a, b) => (anyo(a) || 9999) - (anyo(b) || 9999),
    'dur-asc': (a, b) => (dur(a) || 9999) - (dur(b) || 9999),
    'dur-desc': (a, b) => dur(b) - dur(a),
  }[sel('f-orden').value];
  if (cmp) {
    cards.sort(cmp);
    cards.forEach(c => sel('rejilla').appendChild(c));
  }
}

const FILTROS = ['f-buscar','f-cat','f-jug','f-dur','f-edad','f-mec','f-tem','f-col','f-orden'];
function guardarFiltros() {
  FILTROS.forEach(id => sessionStorage.setItem('flt.' + id, sel(id).value));
  sessionStorage.setItem('flt.f-foto', sel('f-foto').checked ? '1' : '');
  sessionStorage.setItem('flt.f-ubi', sel('f-ubi').checked ? '1' : '');
}
function restaurarFiltros() {
  FILTROS.forEach(id => {
    const v = sessionStorage.getItem('flt.' + id);
    if (v != null) sel(id).value = v;
  });
  sel('f-foto').checked = sessionStorage.getItem('flt.f-foto') === '1';
  sel('f-ubi').checked = sessionStorage.getItem('flt.f-ubi') === '1';
}

const porPagina = () =>
  Math.max(1, getComputedStyle(sel('rejilla')).gridTemplateColumns.split(' ').length) * 4;

function pintar() {
  guardarFiltros();
  const vis = cards.filter(pasa);
  sel('cuenta').textContent = vis.length === cards.length
    ? '' : `· ${vis.length} coinciden con los filtros`;
  let set = aleatorio ? vis.filter(c => aleatorio.has(c)) : vis;
  if (aleatorio && !set.length) { aleatorio = null; set = vis; }   // sorteo vacio -> vista normal
  const por = porPagina();
  const paginas = Math.max(1, Math.ceil(set.length / por));
  pagina = Math.min(pagina, paginas - 1);
  const trozo = new Set(set.slice(pagina * por, (pagina + 1) * por));
  cards.forEach(c => c.classList.toggle('oculto', !trozo.has(c)));
  sel('sin-resultados').classList.toggle('oculto', set.length > 0);

  const pagin = sel('pagin');
  pagin.innerHTML = '';
  if (paginas > 1) {
    const flecha = (txt, dest) => {
      const b = document.createElement('button');
      b.className = 'btn sec';
      b.textContent = txt;
      b.disabled = dest < 0 || dest >= paginas;
      b.onclick = () => { pagina = dest; pintar(); };
      pagin.appendChild(b);
    };
    flecha('‹', pagina - 1);
    // ventana de 8 numeros deslizando alrededor de la pagina actual
    const ini = Math.max(0, Math.min(pagina - 3, paginas - 8));
    for (let i = ini; i < Math.min(ini + 8, paginas); i++) {
      const b = document.createElement('button');
      b.className = 'btn ' + (i === pagina ? '' : 'sec');
      b.textContent = i + 1;
      b.onclick = () => { pagina = i; pintar(); };
      pagin.appendChild(b);
    }
    flecha('›', pagina + 1);
  }
}

/* ==================== mapa ==================== */

function pintarMapa() {
  const div = sel('mapa');
  div.innerHTML = '';
  // familias: padre y expansiones van juntos en la misma balda
  const porId = {};
  datos.juegos.forEach(j => porId[j.id] = j);
  const raiz = j => j.expansion_de ? (porId[j.expansion_de]?.nombre || j.nombre) : j.nombre;
  const porFamilia = (a, b) =>
    raiz(a).localeCompare(raiz(b), 'es') ||
    (!!a.expansion_de) - (!!b.expansion_de) ||          // padre primero
    a.nombre.localeCompare(b.nombre, 'es');
  // agrupa por nombre de ubicacion: cada una puede tener varias baldas
  const grupos = {};
  datos.ubicaciones.forEach(u => {
    (grupos[u.nombre_ubicacion] ??= []).push(u);
  });
  Object.entries(grupos).forEach(([nombre, filas]) => {
    filas.sort((a, b) => b.numero_balda - a.numero_balda);   // balda 1 = la de abajo
    const total = filas.reduce((n, u) => n + u.juegos.length, 0);
    const card = document.createElement('div');
    card.className = 'ubi-card';
    card.innerHTML =
      `<h3>🗄️ ${nombre}</h3>
       <div class="hueco">${total} juegos</div>` +
      filas.map(u =>
        `<div class="balda"><b>Balda ${u.numero_balda} · ${u.juegos.length} juegos</b><div class="juegos">` +
        u.juegos.slice().sort(porFamilia).map(j =>
          `<span class="mini"><img loading="lazy" src="${urlImagen(j.imagen)}"
             alt="" onerror="this.parentNode.classList.add('sin-img');this.remove()">` +
          `<span class="nom">${j.nombre}</span></span>`).join('') +
        '</div></div>').join('');
    div.appendChild(card);
  });
  const sin = coleccion().filter(j => !ubicacionDe[j.id] && !j.prestado).length;
  sel('sin-ubicar').textContent =
    sin ? `🧺 ${sin} juegos sin ubicar.` : '';
}

// tocar una caratula del mapa muestra su nombre (en PC vale el :hover del CSS)
sel('mapa').addEventListener('click', e => {
  const t = e.target.closest('.mini');
  sel('mapa').querySelectorAll('.mini.ver')
    .forEach(m => { if (m !== t) m.classList.remove('ver'); });
  if (t) t.classList.toggle('ver');
});

/* ==================== resumen ==================== */

function bloque(titulo, pares) {
  const max = Math.max(1, ...pares.map(p => p[1]));
  return `<div class="bloque"><h3>${titulo}</h3>` +
    pares.map(([nom, n]) =>
      `<div class="fila-b"><span class="nom">${nom}</span>
        <span class="pista"><span class="barra" style="width:${(n / max * 100).toFixed(1)}%"></span></span>
        <span class="num">${n}</span></div>`).join('') + '</div>';
}

function pintarResumen() {
  // KPIs: mismos conteos que la pagina de inicio web
  const fisicos = coleccion();
  const cuentan = f => datos.juegos.filter(f).length;
  const kpi = (etiqueta, n) =>
    `<div class="kpi"><div class="n">${n}</div><div class="e">${etiqueta}</div></div>`;
  sel('kpis').innerHTML = [
    ['Registrados', datos.juegos.length],
    ['En la ludoteca', fisicos.length],
    ['Lista de deseos', cuentan(j => j.deseado)],
    ['En camino', cuentan(j => j.en_camino)],
    ['En otras ludotecas', cuentan(j => j.otra_ludoteca)],
    ['Prestados', cuentan(j => j.prestado)],
    ['Fuera de coleccion', cuentan(j => j.fuera_coleccion)],
    ['Sin foto', fisicos.filter(j => !j.imagen).length],
    ['Sin ubicar', fisicos.filter(j => !ubicacionDe[j.id] && !j.prestado).length],
  ].map(k => kpi(k[0], k[1])).join('');
  const tabla = { c: CAT, m: MEC, t: TEM };
  const porId = (campo, dict) => {
    const cont = {};
    coleccion().forEach(j => { cont[j[campo] || 0] = (cont[j[campo] || 0] || 0) + 1; });
    return Object.entries(cont)
      .map(([k, n]) => [k === '0' ? 'Sin asignar' : (dict[k] || k), n])
      .sort((a, b) => b[1] - a[1]);
  };
  sel('resumen').innerHTML =
    bloque('Por categoria', porId('categoria_id', tabla.c)) +
    bloque('Por mecanica', porId('mecanica_id', tabla.m)) +
    bloque('Por tematica', porId('tematica_id', tabla.t));
}

/* ==================== editor (anadir / editar) ==================== */

function muebles() {   // {mueble: [numeros de balda ordenados]}
  const m = {};
  datos.ubicaciones.forEach(u =>
    (m[u.nombre_ubicacion] ??= []).push(u.numero_balda));
  Object.values(m).forEach(l => l.sort((a, b) => a - b));
  return m;
}

const opcion = (v, txt) => {
  const o = document.createElement('option');
  o.value = v; o.textContent = txt ?? v; return o;
};

function rellenarBaldas(ubi) {
  const m = muebles();
  const selM = sel('e-mueble'), selB = sel('e-balda');
  selM.innerHTML = '';
  selM.appendChild(opcion('', 'Sin ubicar'));
  Object.keys(m).sort().forEach(n => selM.appendChild(opcion(n)));
  selM.value = ubi ? ubi.mueble : '';
  const pintarB = () => {
    selB.innerHTML = '';
    (m[selM.value] || []).forEach(b => selB.appendChild(opcion(b)));
    selB.disabled = !selM.value;
    if (ubi && ubi.mueble === selM.value) selB.value = ubi.balda;
  };
  selM.oninput = pintarB;
  pintarB();
}

function abrirEditor(j) {
  editando = j || null;
  sel('ed-titulo').textContent = j ? 'Editar juego' : 'Añadir juego';
  const cats = (id, filas, val) => {
    const s = sel(id); s.innerHTML = '';
    s.appendChild(opcion('', '—'));
    filas.forEach(f => s.appendChild(opcion(f.id, f.valor)));
    s.value = val || '';
  };
  cats('e-cat', datos.categorias, j?.categoria_id);
  cats('e-mec', datos.mecanicas, j?.mecanica_id);
  cats('e-tem', datos.tematicas, j?.tematica_id);
  sel('e-nombre').value = j?.nombre || '';
  sel('e-jug').value = j?.jugadores || '';
  sel('e-edad').value = j?.edad || '';
  sel('e-dur').value = j?.duracion || '';
  sel('e-pub').value = j?.publicacion || '';
  sel('e-estado').value =
    j?.deseado ? 'deseado' : j?.en_camino ? 'camino' :
    j?.otra_ludoteca ? 'otra' : j?.fuera_coleccion ? 'fuera' : '';
  sel('e-pre').checked = !!j?.prestado;
  const u = j ? baldaDe(j.id) : null;
  rellenarBaldas(u ? { mueble: u.nombre_ubicacion, balda: u.numero_balda } : null);
  sel('editor').classList.remove('oculto');
}

const cerrarEditor = () => sel('editor').classList.add('oculto');

function guardarEditor() {
  const nombre = sel('e-nombre').value.trim();
  if (!nombre) { alert('Falta el nombre.'); return; }
  const est = sel('e-estado').value;
  const num = v => (v === '' || v === null ? null : +v);
  const txt = v => (v || '').trim() || null;
  const campos = {
    nombre,
    categoria_id: num(sel('e-cat').value),
    mecanica_id: num(sel('e-mec').value),
    tematica_id: num(sel('e-tem').value),
    jugadores: txt(sel('e-jug').value),
    edad: txt(sel('e-edad').value),
    duracion: txt(sel('e-dur').value),
    publicacion: num(sel('e-pub').value),
    deseado: est === 'deseado',
    en_camino: est === 'camino',
    otra_ludoteca: est === 'otra',
    fuera_coleccion: est === 'fuera',
    prestado: sel('e-pre').checked,
  };
  const mueble = sel('e-mueble').value;
  const ubiSel = mueble ? { mueble, balda: +sel('e-balda').value } : null;

  if (editando && typeof editando.id === 'number') {
    const actual = baldaDe(editando.id);
    const misma = actual && ubiSel &&
      actual.nombre_ubicacion === ubiSel.mueble &&
      actual.numero_balda === ubiSel.balda;
    const ubicacion = misma ? null : ubiSel || (actual ? 'quitar' : null);
    cola.cambios.push({ tipo: 'edicion', juego_id: editando.id,
                        campos, ubicacion });
  } else {
    // edicion sobre un alta local aun sin subir -> se funde en su op
    const alta = editando &&
      cola.cambios.find(o => o.tipo === 'alta' && o.tmp_id === editando.id);
    if (alta) {
      Object.assign(alta.campos, campos);
      alta.ubicacion = ubiSel;
    } else {
      cola.cambios.push({ tipo: 'alta', tmp_id: 't' + Date.now(),
                          campos, ubicacion: ubiSel });
    }
  }
  if (!cola.base) cola.base = datosBase.generado || null;
  guardarCola();
  cerrarEditor();
  reconstruir();
}

function actualizarBanner() {
  const n = cola.cambios.length;
  sel('pendientes').classList.toggle('oculto', !n);
  if (!n) return;
  const viejo = cola.base && datosBase.generado && cola.base !== datosBase.generado;
  sel('pend-txt').textContent =
    `⚠️ ${n} cambio${n > 1 ? 's' : ''} sin subir` +
    (viejo ? ' — los datos se actualizaron despues' : '');
}

function descargarCambios() {
  const blob = new Blob(
    [JSON.stringify({ generado_base: cola.base, cambios: cola.cambios }, null, 1)],
    { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cambios.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

// re-aplica la cola y repinta todo tras un cambio
function reconstruir() {
  aplicarCola();
  construir();
  ordenar();
  pintar();
  const nDeseados = datos.juegos.filter(j => j.deseado).length;
  sel('total').textContent =
    `${coleccion().length} juegos en la coleccion · ${nDeseados} deseados`;
  actualizarBanner();
}

/* ==================== vistas / eventos ==================== */

function cambiarVista(v) {
  ['catalogo', 'mapa', 'resumen'].forEach(x => {
    sel('v-' + x).classList.toggle('oculto', x !== v);
    document.querySelector(`nav a[data-vista="${x}"]`).classList.toggle('activo', x === v);
  });
  if (v === 'mapa') pintarMapa();
  if (v === 'resumen') pintarResumen();
}

function rellenarSelects() {
  const llenar = (id, filas) => {
    const s = sel(id);
    filas.forEach(f => {
      const o = document.createElement('option');
      o.value = f.id; o.textContent = f.valor; o.title = f.descripcion || '';
      s.appendChild(o);
    });
  };
  llenar('f-cat', datos.categorias);
  llenar('f-mec', datos.mecanicas);
  llenar('f-tem', datos.tematicas);
  const edades = [...new Set(datos.juegos.map(j => j.edad).filter(Boolean))].sort();
  edades.forEach(e => {
    const o = document.createElement('option');
    o.textContent = e; sel('f-edad').appendChild(o);
  });
}

async function iniciar() {
  sel('cargando').classList.remove('oculto');
  try {
    datosBase = await cargarDatos();
  } catch (e) {
    sel('cargando').innerHTML = `<p>⚠️ ${e.message}</p>`;
    return;
  }
  sel('cargando').classList.add('oculto');

  cola = cargarCola();
  aplicarCola();
  rellenarSelects();
  restaurarFiltros();
  reconstruir();
}

document.querySelectorAll('nav a').forEach(a =>
  a.onclick = () => cambiarVista(a.dataset.vista));

sel('b-ale').onclick = () => {
  const vis = cards.filter(pasa);
  aleatorio = new Set(vis.slice().sort(() => Math.random() - .5).slice(0, 3));
  pagina = 0; pintar();
};
sel('b-limpiar').onclick = () => {
  FILTROS.forEach(id => sel(id).value = '');
  sel('f-foto').checked = false;
  sel('f-ubi').checked = false;
  ordenar(); pagina = 0; aleatorio = null; pintar();
};
sel('b-sync').onclick = async () => {
  const b = sel('b-sync');
  b.classList.add('girando');
  localStorage.removeItem('datos-cache');
  await iniciar();
  b.classList.remove('girando');
};

sel('b-anadir').onclick = () => abrirEditor(null);
sel('e-guardar').onclick = guardarEditor;
sel('e-cancelar').onclick = cerrarEditor;
sel('pend-dl').onclick = descargarCambios;
sel('pend-rm').onclick = () => {
  if (!confirm(`Descartar los ${cola.cambios.length} cambios pendientes?`)) return;
  cola = { base: null, cambios: [] };
  guardarCola();
  reconstruir();
};

window.addEventListener('resize', () => cards.length && pintar());

// listeners de filtros (los ids existen ya en el DOM)
FILTROS.forEach(id => {
  if (id === 'f-orden')
    sel(id).addEventListener('input', () => { ordenar(); pagina = 0; pintar(); });
  else
    sel(id).addEventListener('input', () => { pagina = 0; aleatorio = null; pintar(); });
});
sel('f-foto').addEventListener('input', () => { pagina = 0; aleatorio = null; pintar(); });
sel('f-ubi').addEventListener('input', () => { pagina = 0; aleatorio = null; pintar(); });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // cuando un SW nuevo toma el control (version nueva publicada),
  // recarga una vez para cargar los ficheros frescos: basta una apertura
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (window.__swReload) return;
    window.__swReload = true;
    location.reload();
  });
}

iniciar();
