# Persistencia y archivos

## Propósito

Permite conservar, recuperar y transferir el documento Trazuvia mediante almacenamiento local y archivos JSON.

## Comportamiento principal

- El documento contiene nombre, versión, lienzo, elementos, estilos y metadatos; las modificaciones actualizan `updatedAt` y marcan el estado como no guardado.
- Al iniciar, la aplicación intenta cargar el autoguardado de `localStorage`; mientras el documento esté sucio, vuelve a guardarlo cada 30 segundos bajo una clave fija.
- Guardar conserva el modelo completo localmente. Descargar JSON genera un archivo `.trazuvia.json`; en Electron usa el diálogo nativo y en navegador usa una descarga.
- Abrir acepta un JSON desde el diálogo nativo de Electron o el selector de archivos del navegador. El importador exige versión, lienzo, lista de elementos e identificadores únicos.
- Crear un documento nuevo o abrir otro pide confirmación cuando hay cambios sin guardar y reinicia selección e historial al cargar o restablecer.

## Criterios de aceptación

- Recargar la aplicación con un autoguardado válido restaura nombre, lienzo, estilos y elementos.
- Un JSON válido se carga y se renderiza; un archivo inválido no sustituye el documento y muestra un error.
- En Electron, abrir y guardar pasan por diálogos nativos sin exponer directamente Node al renderer.

## Evidencia de código

- `app/js/io/storage.js`
- `electron-main.js`
- `preload.js`
