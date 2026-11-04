# Mi Ludoteca — app movil (PWA estatica, solo lectura)

Version movil del catalogo: mismos filtros, orden, "3 al azar", mapa de
ubicaciones y resumen. Sin servidor: lee `juegos.json` (local o en Drive).

## Ficheros

- `index.html` + `app.js` + `estilos.css` — la app
- `config.js` — ajustes (carpeta Drive, API key)
- `juegos.json` — datos (lo genera `Exportar movil.py`)
- `imagenes/` — caratulas (lo genera `Exportar movil.py`)
- `manifest.webmanifest` + `sw.js` + `icono.svg` — PWA (instalable)

## Actualizar datos (flujo habitual)

1. Edita juegos en la web del PC como siempre.
2. Ejecuta `python "Exportar movil.py"` (con la API levantada).
3. Publica lo generado: **sube `juegos.json` y las imagenes nuevas a tu
   carpeta de Drive** (raiz el json, dentro de `imagenes/` las caratulas)
   o sube la carpeta `apk/` a tu hosting estatico.

## Dos modos de datos

### A) Sin API key (mas simple)

Deja `API_KEY = ''` en `config.js` y sube la carpeta `apk/` entera a un
hosting estatico gratis: GitHub Pages, Cloudflare Pages o Netlify.
El `juegos.json` y `imagenes/` viajan dentro → cero dependencia de Drive.

Para probar en local: `python -m http.server 8080` dentro de `apk/` y
abrir `http://localhost:8080`.

### B) Con Drive como fuente (datos siempre frescos)

1. En Google Cloud Console crea un proyecto, habilita
   **Google Drive API** y crea una **API key** (credenciales > clave de API;
   puedes restringirla a Drive API).
2. Pon la clave en `API_KEY` en `config.js`.
3. En tu carpeta publica de Drive: `juegos.json` en la raiz y las caratulas
   dentro de la subcarpeta `imagenes/` (nombres exactos, p. ej. `822.png`).

Con key, la app lee json + imagenes de Drive al abrirse; sin red usa la
ultima cache y, si falla Drive, cae al json local.

## Instalar como app

- **Android**: abre la URL en Chrome > menu ⋮ > "Anadir a pantalla de
  inicio" o "Instalar app".
- **iPhone**: Safari > Compartir > "Anadir a pantalla de inicio".
- **PC**: Chrome > icono de instalar en la barra de direcciones.

## Convertir a APK (opcional)

Con la PWA publicada en una URL https, entra en <https://www.pwabuilder.com>,
pega la URL y te genera el paquete APK/AAB sin escribir codigo Android.

## Notas

- `prestado_a` NO se exporta por defecto (por privacidad). Cambia
  `INCLUIR_PRESTADO = True` en `Exportar movil.py` si lo quieres.
- Para iconos PNG de tienda, PWABuilder los genera a partir de `icono.svg`.
