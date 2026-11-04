/* Mi Ludoteca - app estatica (solo lectura).
   Datos: juegos.json e imagenes/ servidos junto a la app (GitHub Pages). */
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
      pre: j.prestado ? '1' : '',
    });
    const badges =
      (j.deseado ? '<span class="badge b-deseado" title="Lista de deseos">❤️</span>' : '') +
      (j.en_camino ? '<span class="badge b-camino" title="En camino">🚚</span>' : '') +
      (j.prestado ? '<span class="badge b-prestado" title="Prestado">🤝</span>' : '');
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
    d.innerHTML =
      `${badges}<img loading="lazy" alt="" src="${urlImagen(j.imagen)}"
          onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
       <div class="cuerpo"><h3>${j.nombre}</h3>
        <div class="chips">${chips}</div>
        <div class="meta">${meta}</div>${ubi}</div>`;
    rejilla.appendChild(d);
    return d;
  });
}

/* ==================== filtros / orden ==================== */

function pasa(c) {
  const t = sel('f-buscar').value.toLowerCase();
  if (t && !c.dataset.nombre.includes(t)) return false;
  if (sel('f-cat').value && c.dataset.cat !== sel('f-cat').value) return false;
  if (sel('f-mec').value && c.dataset.mec !== sel('f-mec').value) return false;
  if (sel('f-tem').value && c.dataset.tem !== sel('f-tem').value) return false;
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
  const w = sel('f-des').value;
  if (w === '1' && c.dataset.des !== '1') return false;
  if (w === '0' && c.dataset.des === '1') return false;
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

const FILTROS = ['f-buscar','f-cat','f-jug','f-dur','f-edad','f-mec','f-tem','f-des','f-orden'];
function guardarFiltros() {
  FILTROS.forEach(id => sessionStorage.setItem('flt.' + id, sel(id).value));
}
function restaurarFiltros() {
  FILTROS.forEach(id => {
    const v = sessionStorage.getItem('flt.' + id);
    if (v != null) sel(id).value = v;
  });
}

const porPagina = () =>
  Math.max(1, getComputedStyle(sel('rejilla')).gridTemplateColumns.split(' ').length) * 4;

function pintar() {
  guardarFiltros();
  const vis = cards.filter(pasa);
  sel('cuenta').textContent = vis.length === cards.length
    ? '' : `· ${vis.length} coinciden con los filtros`;
  const set = aleatorio ? vis.filter(c => aleatorio.has(c)) : vis;
  const por = porPagina();
  const paginas = Math.max(1, Math.ceil(set.length / por));
  pagina = Math.min(pagina, paginas - 1);
  const trozo = new Set(set.slice(pagina * por, (pagina + 1) * por));
  cards.forEach(c => c.classList.toggle('oculto', !trozo.has(c)));
  sel('sin-resultados').classList.toggle('oculto', set.length > 0);

  const pagin = sel('pagin');
  pagin.innerHTML = '';
  if (paginas > 1) {
    for (let i = 0; i < paginas; i++) {
      const b = document.createElement('button');
      b.className = 'btn ' + (i === pagina ? '' : 'sec');
      b.textContent = i + 1;
      b.onclick = () => { pagina = i; pintar(); };
      pagin.appendChild(b);
    }
  }
}

/* ==================== mapa ==================== */

function pintarMapa() {
  const div = sel('mapa');
  div.innerHTML = '';
  // agrupa por nombre de ubicacion: cada una puede tener varias baldas
  const grupos = {};
  datos.ubicaciones.forEach(u => {
    (grupos[u.nombre_ubicacion] ??= []).push(u);
  });
  Object.entries(grupos).forEach(([nombre, filas]) => {
    filas.sort((a, b) => a.numero_balda - b.numero_balda);
    const total = filas.reduce((n, u) => n + u.juegos.length, 0);
    const card = document.createElement('div');
    card.className = 'ubi-card';
    card.innerHTML =
      `<h3>🗄️ ${nombre}</h3>
       <div class="hueco">${total} juegos</div>` +
      filas.map(u =>
        `<div class="balda"><b>Balda ${u.numero_balda}</b><div class="juegos">` +
        u.juegos.map(j =>
          `<span class="mini"><img loading="lazy" src="${urlImagen(j.imagen)}"
             onerror="this.style.display='none'">${j.nombre}</span>`).join('') +
        '</div></div>').join('');
    div.appendChild(card);
  });
  const sin = datos.juegos.filter(j => !ubicacionDe[j.id]).length;
  sel('sin-ubicar').textContent =
    sin ? `🧺 ${sin} juegos sin ubicar.` : '';
}

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
  const tabla = { c: CAT, m: MEC, t: TEM };
  const porId = (campo, dict) => {
    const cont = {};
    datos.juegos.forEach(j => { cont[j[campo] || 0] = (cont[j[campo] || 0] || 0) + 1; });
    return Object.entries(cont)
      .map(([k, n]) => [k === '0' ? 'Sin asignar' : (dict[k] || k), n])
      .sort((a, b) => b[1] - a[1]);
  };
  sel('resumen').innerHTML =
    bloque('Por categoria', porId('categoria_id', tabla.c)) +
    bloque('Por mecanica', porId('mecanica_id', tabla.m)) +
    bloque('Por tematica', porId('tematica_id', tabla.t));
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
    datos = await cargarDatos();
  } catch (e) {
    sel('cargando').innerHTML = `<p>⚠️ ${e.message}</p>`;
    return;
  }
  sel('cargando').classList.add('oculto');

  sel('total').textContent = `${datos.juegos.length} juegos en la coleccion`;
  rellenarSelects();
  construir();
  restaurarFiltros();
  ordenar();
  pintar();
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
  ordenar(); pagina = 0; aleatorio = null; pintar();
};
sel('b-sync').onclick = async () => {
  const b = sel('b-sync');
  b.classList.add('girando');
  localStorage.removeItem('datos-cache');
  await iniciar();
  b.classList.remove('girando');
};

window.addEventListener('resize', () => cards.length && pintar());

// listeners de filtros (los ids existen ya en el DOM)
FILTROS.forEach(id => {
  if (id === 'f-orden')
    sel(id).addEventListener('input', () => { ordenar(); pagina = 0; pintar(); });
  else
    sel(id).addEventListener('input', () => { pagina = 0; aleatorio = null; pintar(); });
});

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
