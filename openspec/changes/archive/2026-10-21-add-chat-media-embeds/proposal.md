# Proposal

## Why

El chat solo renderiza los mensajes como texto plano. Cuando un usuario pega la URL de una imagen o de un video de YouTube, lo demás ve solo el texto del enlace, sin poder ver el contenido directamente. Se requiere que el_chat detecte esos enlaces y los muestre inline: imágenes dentro del mensaje y videos de YouTube como reproductor embebido.

## What Changes

- Permitir que el campo de texto del chat acepte URLs arbitrarias (ya funciona por defecto, no se modifica el formulario).
- Detectar por regex, en el servidor, si el mensaje es: una URL de imagen (`.jpg`, `.jpeg`, `.gif`, `.png`, `.bmp`), una URL de video de YouTube (`youtube.com` / `youtu.be`) o texto normal.
- Si es imagen: convertir el mensaje en un tag `<img>` que se renderiza directamente en el chat (cliente via `.html()`).
- Si es video de YouTube: convertir el mensaje en un `<iframe>` con el reproductor embebido de YouTube (`https://www.youtube.com/embed/<id>`).
- Si es texto: se envía tal cual, sin transformación.
- Sanitizar los caracteres peligrosos (`<`, `>`, `"`, `'`) de la URL al construir el tag de imagen para evitar inyección de HTML/XSS.
- Corregir los bugs existentes en `libs/unalib.js` donde `is_valid_url_image` e `is_valid_yt_video` probaban la variable inexistente `phone` en vez de `url`.

## Capabilities

### New Capabilities

- `chat-messages`: Envío, validación y renderizado de mensajes del chat, incluyendo la detección y embebido de imágenes y videos de YouTube.

### Modified Capabilities

- (ninguna: no existen specs previas en el proyecto)

## Impact

- **Code**: `libs/unalib.js` (validaciones regex, generadores de tags `getEmbeddedCode` / `getImageTag`, `validateMessage`); no se requieren cambios en `index.html` ni `server.js`.
- **Tests**: `test/test.js` — los tests existentes de `is_valid_url_image` e `is_valid_yt_video` deben pasar tras el fix (`npm test`).
- **Dependencies**: sin cambios; solo librerías ya presentes (socket.io, express, jQuery en el cliente).
- **Seguridad**: transformación de URLs a HTML en el servidor; mitigación de XSS por sanitización de comillas y corchetes angulares en URLs de imagen.
