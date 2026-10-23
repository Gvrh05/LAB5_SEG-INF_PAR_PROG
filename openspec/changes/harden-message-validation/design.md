# Design

## Context

Tras archivar `add-chat-media-embeds` quedó el `<img>`, el `<iframe>` de YouTube y el flujo `validateMessage` funcionando, con sanitize mínimo solo en `getImageTag`. El cliente (`index.html`) inserta todo con `.html()`, así que todo string de `nombre`, `color` o texto plano de `mensaje` es HTML ejecutable en el navegador. Véase `openspec/specs/chat-messages/spec.md` para el comportamiento vigente.

## Goals / Non-Goals

**Goals:**
- Cero ejecutable HTML/JS desde ningún campo del payload (`nombre`, `mensaje`, `color`).
- Embebido restringido a URLs COMPLETAS de imagen o de video de YouTube válido (regexes anclados + ID de video con pattern estricto).
- Validación 100% con expresiones regulares nativas, sin nuevas dependencias.

**Non-Goals:**
- No se validan URLs con CSS, consultas HTTP (HEAD) ni bibliotecas de tipo de archivo; es regex estático sobre el texto.
- No se cambia el cliente ni el protocolo del socket.
- No se implementa CSP ni sanitizador completo tipo DOMPurify (fuera de alcance del lab).

## Decisions

1. **Escape de entidades HTML propio y pequeño (`escapeHtml`)**, con mapa `&`→`&amp;` PRIMERO, luego `<`, `>`, `"`, `'`. Alternativa descartada: librerías (`sanitize-html`, `jsdom`) — agrega peso de dependencias que el lab no necesita para el nivel de amenaza (solo se inserta texto/URL en dos tags conocidos).
2. **Regex de imagen anclado** `/^(https?:\/\/)?[^\s"'<>]+\.(?:jpg|jpeg|gif|png|bmp)$/i` (sin espacios ni comillas ni angulares). Correctivo frente al regex suelto previo que transformaba a media frase. Los espacios del payload quedan de parte del texto → texto escapado.
3. **Whitelist de ID de YouTube** `/^[A-Za-z0-9_-]{1,11}$/` aplicada al segmento extraído por `getYTVideoId`; si no cumple, el `<iframe>` no se construye y el mensaje sale como texto escapado. Evita interpolar nada distinto de a un ID con caracteres seguros.
4. **Validación de `color` con `^#[0-9A-Fa-F]{3,8}$`;** si no cumple, go empty string. Previene `style`/HTML por el campo.
5. **`nombre` se escapa SIEMPRE** (que sea válido con cualquier charset) porque se interpola en un `<b style="...">` en el cliente.
6. **Payload no-JSON → `{ mensaje: "" }`** (en vez de devolver el string crudo), consolidando el tratado del erro r actual.
7. **Orden de aplicar detección**: imagen → video → escape. Reutilizar `getImageTag` (con su sanitize actual) y `getEmbeddedCode` (modificado a validar ID).

## Risks / Trade-offs

- [Mensaje legítimo con URL de imagen a media frase ya no se convierte en imagen] → comportamiento deseado según requisito (completo); alternativa: enlaces tipo markdown fuera de scope.
- [Escape cambia el wire-format para clientes no-navegador que interpretaban el texto crudo] → solo impacto en este chat; el cliente existente mostraba igual texto plano.
- [Regex de imagen acepta basura antes de la extensión (por ejemplo `a\nb.jpg`)] → mitigado con `[^\s]` que exclule espacios y saltos de línea.
- [Escape no cubre jQuery injection vía CSS del color] → el color ahora solo acepta hex, y `nombre` escapa `"` y `'` antes de interpolarse en el atributo `style`.

## Migration Plan

Cambios solo en `libs/unalib.js` + nuevos tests. El formato del evento y el cliente no cambian. Despliegue: `npm test` verde → reiniciar `node server.js`. Rollback: `git revert` del commit.

## Open Questions

Ninguna.
