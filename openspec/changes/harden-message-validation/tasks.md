# Tasks

## 1. Utilidades de validación en `libs/unalib.js`

- [x] 1.1 Agregar `escapeHtml(texto)` que convierta `&`,`<`,`>`,`"`,`'` a entidades HTML — verificar con `node -e` que `escapeHtml("<script>alert('a')&\"x\"</script>")` no contiene `<` literal en el resultado
- [x] 1.2 Agregar `isValidColor(color)` con regex `^#[0-9A-Fa-F]{3,8}$` — verificar con `node -e` que `#a1b2c3` → true y `#123; background:red` → false

## 2. Validación de URLs e IDs

- [x] 2.1 Anclar `is_valid_url_image` a `^(https?:\/\/)?[^\s"'<>]+\.(?:jpg|jpeg|gif|png|bmp)$` — verificar con `node -e` que URL completa → true y texto con URL a media frase → false
- [x] 2.2 En `getEmbeddedCode`, validar el ID con `^[A-Za-z0-9_-]{1,11}$` antes de construir el `<iframe>`; ID inválido → devolver el mensaje de texto escapado (usar `escapeHtml`) — verificar con `node -e`

## 3. `validateMessage` endurecido

- [x] 3.1 En `validateMessage`: escapar `nombre`, validar `color` (vacío si no cumple), transformar `mensaje` solo si es URL completa de imagen o YouTube válido, y escapar el texto en cualquier otro caso; payload no-JSON → `{ "mensaje": "" }` — verificar con `node -e` con los 3 payloads del spec (texto con `<script>`, nombre con `<script>`, color inválido)
- [x] 3.2 Actualizar `try/catch` para no devolver el mensaje crudo en error — verificar con `node -e` con payload `not-json {`

## 4. Pruebas

- [x] 4.1 Agregar casos a `test/test.js`: `nombre` con `<script>` sale escapado, mensaje de texto con `<script>` sale escapado, `color` inválido → `""`, URL a media frase sale como texto escapado — ejecutar `npm test` y confirmar que los 5 casos previos siguen verdes más los nuevos
- [x] 4.2 Verificación end-to-end con dos clientes socket.io (`node server.js` + `test/e2e-manual.js` actualizado): texto con `<script>` llega escapado, nombre con `<script>` llega escapado, imagen y YouTube siguen embebidos

## Workflow follow-up

- Archivar el change al finalizar con `/opsx-archive` (synced a `openspec/specs/chat-messages/spec.md`).
