# chat-messages Specification

## Purpose

Define el comportamiento del chat con respecto al envío, validación y renderizado de mensajes: mensajes de texto plano, inyección de imágenes por URL y reproductores embebidos de YouTube, de forma segura (sin inyección de HTML desde un mensaje).

## Requirements

### Requirement: El campo de texto acepta URLs
El formulario del chat SHALL permitir al usuario escribir una URL en el campo de texto y enviarla como parte del mensaje JSON `{ nombre, mensaje, color }` por el evento `Evento-Mensaje-Server`.

#### Scenario: El usuario envía una URL como mensaje
- **WHEN** el usuario escribe `https://example.com/image.jpg` en el campo de texto y presiona Send
- **THEN** el cliente emite el evento `Evento-Mensaje-Server` con la URL como valor de `mensaje` (sin modificar el formulario ni agregar acciones nuevas)

### Requirement: Detección de imagen por URL
La validación del mensaje en el servidor SHALL detectar como imagen toda URL que apunte a un archivo `.jpg`, `.jpeg`, `.gif`, `.png` o `.bmp` (con o sin esquema `http(s)://`).

#### Scenario: URL válida de imagen
- **WHEN** el mensaje es `http://image.com/image.jpg`
- **THEN** la validación la clasifica como imagen

#### Scenario: URL que no es imagen
- **WHEN** el mensaje es `https://example.com/imagen.txt`
- **THEN** la validación NO la clasifica como imagen

### Requirement: Renderizado de imagen en el chat
Cuando el mensaje sea una URL de imagen válida, el servidor SHALL transformar el mensaje en un tag `<img>` con el `src` de la URL y estilo de tamaño acotado (`max-height`/`max-width`), de modo que la imagen se muestre directamente en el historial del chat.

#### Scenario: Imagen mostrada en el chat
- **WHEN** un participante del chat recibe un mensaje cuya URL es de una imagen
- **THEN** ve la imagen renderizada dentro del ítem del mensaje, no el texto de la URL

### Requirement: Detección de video de YouTube por URL
La validación del mensaje en el servidor SHALL detectar como video de YouTube toda URL de los dominios `youtube.com` (incluyendo `watch?v=`, `/embed/`, `/v/`) o `youtu.be` (incluyendo ID corto), con o sin esquema `http(s)://` y con o sin `www.`.

#### Scenario: URL válida de YouTube
- **WHEN** el mensaje es `https://www.youtube.com/watch?v=qYwlqx-JLok`
- **THEN** la validación la clasifica como video de YouTube

#### Scenario: Otras URLs de video no son YT
- **WHEN** el mensaje es `https://vimeo.com/123456`
- **THEN** la validación NO la clasifica como video de YouTube

### Requirement: Reproductor de YouTube embebido en el chat
Cuando el mensaje sea una URL de video de YouTube válida, el servidor SHALL transformar el mensaje en un `<iframe>` con `src="https://www.youtube.com/embed/<VIDEO_ID>"`, con `allowfullscreen` y los atributos de reproducción estándar, de modo que el chat muestre un reproductor de video.

#### Scenario: Reproductor mostrado en el chat
- **WHEN** un participante del chat recibe un mensaje cuya URL es de YouTube con ID `qYwlqx-JLok`
- **THEN** ve un reproductor embebido cuyo `src` apunta a `https://www.youtube.com/embed/qYwlqx-JLok`

### Requirement: Mensajes de texto se envían sin transformación
Si el mensaje no es una URL de imagen ni de video de YouTube, el servidor SHALL re-emitirlo sin transformar su contenido.

#### Scenario: Texto normal
- **WHEN** el mensaje es `Hola a todos`
- **THEN** el contenido se re-emitte tal cual y se muestra como texto

### Requirement: Transformación segura ante HTML malicioso
Al construir los tags `<img>` e `<iframe>`, el servidor SHALL no inyectar HTML/JS arbitrario contenido en el mensaje: los caracteres `<`, `>`, `"`, `'` de una URL de imagen SHALL eliminarse antes de insertar la URL en el tag.

#### Scenario: Intento de XSS en imagen
- **WHEN** el mensaje es `x"><script>alert(1)</script>http://a/x.jpg`
- **THEN** la URL insertada en el `<img>` no contiene enunciados `<script>` ni comillas dobles
