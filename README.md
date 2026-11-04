# Mi Ludoteca — app movil (PWA estatica, solo lectura)

Version movil del catalogo: mismos filtros, orden, "3 al azar", mapa de
ubicaciones (por mueble y balda) y resumen. Sin servidor ni Drive: lee
`juegos.json` e `imagenes/` servidos junto a la app en GitHub Pages.

## Ficheros

- `index.html` + `app.js` + `estilos.css` — la app
- `juegos.json` — datos (lo genera `Exportar movil.py`)
- `imagenes/` — caratulas (lo genera `Exportar movil.py`)
- `manifest.webmanifest` + `sw.js` + `icono.svg` — PWA (instalable)

## Actualizar datos (flujo habitual)

1. Edita juegos en la web del PC como siempre.
2. Ejecuta `python "Exportar movil.py"` (con la API levantada).
3. Publica con git:

   ```powershell
   git add -A; git commit -m "datos"; git push
   ```

4. Espera ~2-3 min a que despliegue GitHub Pages y abre la app (o pulsa ⟳).

Si tocas codigo de la app, sube ademas la version de cache en `sw.js`
(p. ej. `ludoteca-v5` -> `v6`) para que los clientes instalados reciban
los ficheros nuevos.

## Instalar como app

- **Android**: abre la URL en Chrome > menu ⋮ > "Anadir a pantalla de
  inicio" o "Instalar app".
- **iPhone**: Safari > Compartir > "Anadir a pantalla de inicio".
- **PC**: Chrome > icono de instalar en la barra de direcciones.

## Convertir a APK (opcional)

Con la PWA publicada en una URL https, entra en <https://www.pwabuilder.com>,
pega la URL y te genera el paquete APK/AAB sin escribir codigo Android.
