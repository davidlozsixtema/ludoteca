// ====================== AJUSTES DE LA APP ======================
// Carpeta raiz publica de Drive (la que compartiste):
const CARPETA_RAIZ = '149Aii2svLEPeo5llBMN0JkyLXThveAOj';

// Nombre del json y de la subcarpeta de caratulas dentro de la raiz:
const FICHERO_JSON = 'juegos.json';
const CARPETA_IMAGENES = 'imagenes';

// API key de Google Cloud con "Google Drive API" habilitada (gratis).
// - Con key: la app lee juegos.json y las caratulas DESDE DRIVE.
// - Sin key: la app usa el ./juegos.json y ./imagenes/ locales.
const API_KEY = 'AIzaSyASk8fuiKoMNJviHMVaPdHW_rNXvucC6OY';

// Cuando hay key, re-descarga el json aunque haya cache (datos frescos).
const PREFERIR_DRIVE = true;
