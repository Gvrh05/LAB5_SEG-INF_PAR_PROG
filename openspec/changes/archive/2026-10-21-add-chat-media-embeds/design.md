# Design

## Context

El proyecto es un chat Socket.IO: el cliente (`index.html`) emite `Evento-Mensaje-Server` con `{ nombre, mensaje, color }`, el servidor (`server.js`) pasa el mensaje por `validation.validateMessage()` en `libs/unalib.js` y lo re-emite a todos con `io.emit`. El cliente renderiza con jQuery `$('#messages').append($('<li>').html(mensajeDisplay))`, es decir, inserta HTML tal cual. La lógica de imágenes/videos ya existe en `libs/unalib.js` pero está rota: `is_valid_url_image` e `is_valid_yt_video` usan `re.test(phone)` (variable inexistente en esas funciones) en vez de `re.test(url)`, por lo que siempre devuelven `false` y `validateMessage` nunca transforma los enlaces.

## Goals / Non-Goals

**Goals:**
- Hacer funcionar la detección y embebido existente corrigiendo los bugs, sin reescribir la arquitectura.
- Renderizado: imágenes como `<img>` inline, videos exclusivamente de YouTube como `<iframe>` embebido (`youtube.com/embed`).
- Evitar XSS al construir los tags: sanitizar `<`, `>`, `"`, `'` en URLs de imagen.

**Non-Goals:**
- No se soportan URLs de video distintas de YouTube (Vimeo, mp4 directos, etc.).
- No se cambia el protocolo del socket, los eventos ni el formato JSON del mensaje.
- No se modifica el diseño/estilo del chat ni el formulario.
- No se agrega conversión automática de texto→HTML en el cliente; el cliente sigue siendo el ya existente.

## Decisions

1. **Detección en el servidor, no en el cliente.** `validateMessage` ya se ejecuta entre emit y re-emit; transformar ahí garantiza que todos los clientes (móvil incluido) reciban el HTML listo. Alternativa: detectar en el cliente jQuery antes de enviar — se descarta porque rompería la validación centralizada y dejaría sin transformar mensajes provenientes de cualquier otro emisor.
2. **Regex no anclado para imágenes (se conserva el original).** `/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|bmp)/i` acepta URLs dentro de frases. Riesgo conocido y mitigado con sanitización al construir el tag.
3. **Regex más simple y tolerante para YouTube.** Se reemplaza el regex original por `/^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i`, que cubre `watch?v=`, `/embed/`, `/v/` y enlaces cortos de `youtu.be` con o sin `https://www.`.
4. **Extracción de ID de video sin cambios.** `getYTVideoId` ya captura el ID hasta `&` o espacio con su regex actual; el copy del `<iframe>` con `youtube.com/embed/<id>` se mantiene tal como está el proyecto.
5. **Sanitización por eliminación de caracteres en `getImageTag`.** `String(url).replace(/[<>"']/g, '')` antes de interpolar en `src`. Alternativa: escapar entidades HTML — se descarta por mantener el mínimo cambio al código del lab.
6. **Predicado imagen antes que video en `validateMessage`.** Se conserva el orden `if(is_valid_url_image) ... else if(is_valid_yt_video) ... else texto`.

## Risks / Trade-offs

- [Regex de imagen no anclado puede clasificar como imagen un texto que contenga una URL de imagen] → comportamiento aceptado para el lab; la sanitización evita el XSS derivado.
- [XSS vía contenido distinto de la URL en el `mensaje`] → no se escapa el mensaje general (limitación del código base); el cambio solo mitiga en el tag de imagen. Documentado para posible mejora futura.
- [`getEmbeddedCode` con URL de YouTube malformada puede romper `getYTVideoId` (match undefined)] → el chequeo previo con `is_valid_yt_video` garantiza dominios YT antes de pasar a `getEmbeddedCode`.
- [`iframe` de YouTube requiere conexión a internet en el cliente] → dependencia externa ya presente en el proyecto (socket.io CDN, jQuery CDN).

## Migration Plan

Los cambios son retrocompatibles: no se alteran eventos, firma de `validateMessage` ni persistencia. Despliegue: detener el server, `npm test`, reiniciar `node server.js`. Rollback: `git revert` del commit.

## Open Questions

Ninguna.
