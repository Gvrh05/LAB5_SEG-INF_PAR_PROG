# Proposal

## Why

`validateMessage` en `libs/unalib.js` (la lib de UNA / `una-lib`) transforma y re-esmite el mensaje sin desinfectar los demás campos, y el regex de imágenes no es anclado. Como el cliente renderiza el mensaje con `.html()`, un atacante puede colar HTML/JS por el nombre de usuario, el color o el texto del mensaje (por ejemplo `<script>alert(1)</script>`), y un texto que solo contiene una URL de imagen a media frase se transforma en `<img>` indebidamente. Se requiere endurecer la validación contra inyección de scripts y restringir el embebido a URLs completas de imágenes o videos de YouTube válidas.

## What Changes

- **BREAKING** (comportamiento observable, sin romper el protocolo): los mensajes de texto ya no se re-emitien "tal cual": el texto plano SHALL escaparse a entidades HTML (`&`, `<`, `>`, `"`, `'`) para que el código malicioso nunca se ejecute en el cliente (se muestra como texto literal).
- Validar y desinfectar `nombre` (mismas entidades HTML) y `color` (debe coincidir con `^#[0-9A-Fa-F]{3,8}$`; si no, se reemplaza por cadena vacía y el cliente usa el fallback).
- Anclar el regex de imagen: solo se clasifica como imagen cuando el mensaje COMPLETO es una URL de imagen (`^(https?:\/\/)?[^\s"'<>]+\.(jpg|jpeg|gif|png|bmp)$`); un texto que contiene una URL a media frase se trata como texto.
- Validar el ID de video extraído antes de construir el `<iframe>`: el ID debe coincidir con `^[A-Za-z0-9_-]{1,11}$`; si no, el mensaje se emite como texto escapado.
- Si el payload recibido no es JSON válido y procesable, el mensaje se descarta (se re-emite vacío), nunca el texto crudo.
- Consolidar la sanitización existente del tag de imagen (eliminación de `<`, `>`, `"`, `'` en `getImageTag`) dentro del nuevo esquema de validación.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `chat-messages`: cambian los requisitos "Mensajes de texto se envían sin transformación" (ahora se escapen a HTML), "Detección de imagen por URL" (regex anclado, solo mensaje completo), "Renderizado de imagen en el chat" (solo URLs completas) y "Transformación segura ante HTML malicioso" (ahora cubre todo el payload: nombre, color, mensaje texto e iframe); además se agrega un requisito nuevo sobre el campo `color`.

## Impact

- **Code**: `libs/unalib.js` — `validateMessage`, `is_valid_url_image` (regex anclado), `getEmbeddedCode` (validación de ID), nuevas utilidades `escapeHtml/isValidColor`; `index.html` y `server.js` sin cambios.
- **Tests**: `test/test.js` — nuevos casos: `nombre` con `<script>` debe salir escapado; mensaje texto con `<script>` HA DE salir escapado y no ejecutable; `color` inválido → `""`; los 5 casos existentes se mantienen verdes.
- **Dependencies**: sin cambios (solo regex; no se requiere biblioteca nueva).
- **Compatibilidad**: el protocolo (evento y formato JSON `{ nombre, mensaje, color }`) queda igual; `client-side .html()` del cliente no se toca.
