# Spec Delta

## MODIFIED Requirements

### Requirement: Detección de imagen por URL
La validación del mensaje en el servidor SHALL detectar como imagen un mensaje cuyo contenido COMPLETO es una URL que apunte a un archivo `.jpg`, `.jpeg`, `.gif`, `.png` o `.bmp` (con o sin esquema `http(s)://`), mediante un regex anclado que no admite espacios ni comillas; un texto que contiene una URL de imagen dentro de una frase SHALL tratarse como texto, no como imagen.

#### Scenario: URL válida de imagen
- **WHEN** el mensaje completo es `http://image.com/image.jpg`
- **THEN** la validación lo clasifica como imagen

#### Scenario: URL de imagen con esquema opcional y sin espacios
- **WHEN** el mensaje completo es `www.image.com/image.jpg`
- **THEN** la validación lo clasifica como imagen

#### Scenario: URL que no es imagen
- **WHEN** el mensaje completo es `https://example.com/imagen.txt`
- **THEN** la validación NO lo clasifica como imagen

#### Scenario: Texto con URL de imagen a media frase NO es imagen
- **WHEN** el mensaje es `Hoy: <script>alert(1)</script> http://image.com/image.jpg bye`
- **THEN** la validación NO lo clasifica como imagen y el mensaje se emite escalado como texto

### Requirement: Renderizado de imagen en el chat
Cuando el mensaje completo sea una URL de imagen válida (según la detección anclada), el servidor SHALL transformarlo en un tag `<img>` con el `src` sanitizado y estilo de tamaño acotado (`max-height`/`max-width`), de modo que la imagen se muestre directamente en el historial del chat; ningún otro mensaje SHALL emitirse como `<img>`.

#### Scenario: Imagen mostrada en el chat
- **WHEN** un participante del chat recibe un mensaje cuya URL completa es de una imagen
- **THEN** ve la imagen renderizada dentro del ítem del mensaje, no el texto de la URL

### Requirement: Reproductor de YouTube embebido en el chat
Cuando el mensaje completo sea una URL de video de YouTube válida, el servidor SHALL transformarlo en un `<iframe>` con `src="https://www.youtube.com/embed/<VIDEO_ID>"` solo si el ID extraído coincide con `^[A-Za-z0-9_-]{1,11}$`; si el ID no cumple, el mensaje SHALL emitirse como texto escapado. El `<iframe>` conserva `allowfullscreen` y los atributos estándar de reproducción.

#### Scenario: Reproductor mostrado en el chat
- **WHEN** un participante del chat recibe un mensaje cuya URL completa es de YouTube con ID `qYwlqx-JLok`
- **THEN** ve un reproductor embebido cuyo `src` apunta a `https://www.youtube.com/embed/qYwlqx-JLok`

#### Scenario: ID de video con caracteres prohibidos
- **WHEN** el mensaje es una URL de YouTube cuyo segmento de ID contiene `"` o `<>`
- **THEN** el mensaje se emite escalado como texto y nunca como `<iframe>`

### Requirement: Transformación segura ante HTML malicioso
El servidor SHALL impedir que un mensaje inyecte HTML o ejecutable: el campo `nombre` del mensaje SHALL escaparse a entidades HTML (`&`, `<`, `>`, `"`, `'`) antes de emitir; el `mensaje` solo puede renderizarse como `<img>` o `<iframe>` cuando sea una URL completa permitida, emitido como texto escapado en cualquier otro caso; el ID de video interpolado en el `<iframe>` SHALL validarse contra `^[A-Za-z0-9_-]{1,11}$` y la URL del `<img>` SHALL eliminase los caracteres `<`, `>`, `"`, `'`.

#### Scenario: Intento de XSS en imagen
- **WHEN** el mensaje es `x"><script>alert(1)</script>http://a/x.jpg`
- **THEN** la URL insertada en el `<img>` no contiene `<script>` ni comillas dobles

#### Scenario: Intento de XSS por el nombre
- **WHEN** el payload incluye `{ "nombre": "<script>alert(1)</script>", "mensaje": "adiós", "color": "#123456" }`
- **THEN** el nombre emite escapado (sin delimitadores `<script>` ejecutables) y el mensaje sale como texto escapado

#### Scenario: Intento de XSS en el texto del mensaje
- **WHEN** el mensaje es `<script>alert('xss')</script>`
- **THEN** el servidor lo emite con entidades HTML y el cliente lo muestra como texto literal, sin ejecutarlo

## REMOVED Requirements

### Requirement: Mensajes de texto se envían sin transformación
**Reason**: re-emitir el texto crudo permitía inyección de HTML/JS en el cliente (`<script>`, atributos `onerror`, etc.). Se reemplaza por escape obligatorio a entidades HTML para prevenir XSS.
**Migration**: el texto ahora llega con entidades HTML (`&lt;`, `&gt;`, `&quot;`, `&#39;`, `&amp;`); texto sin caracteres especiales (por ejemplo `Hola a todos`) llega idéntico, así que el cliente existente que inserta HTML sigue mostrando el mensaje correctamente.

## ADDED Requirements

### Requirement: El texto no detectado como URL se escapa a HTML
Si el mensaje completo no es una URL de imagen ni de video de YouTube, el servidor SHALL emitir el campo `mensaje` con sus caracteres `&`, `<`, `>`, `"`, `'` convertidos a entidades HTML, de modo que el cliente nunca renderice el contenido como código.

#### Scenario: Texto normal se recibe idéntico
- **WHEN** el mensaje es `Hola a todos`
- **THEN** el contenido emitido es el mismo `Hola a todos` y se muestra como texto

#### Scenario: Mensaje con etiquetas se emite escapado
- **WHEN** el mensaje es `<script>alert(1)</script>`
- **THEN** el contenido emitido no contiene la cadena `<script>` literal

### Requirement: Color del mensaje validado por patrón
El servidor SHALL validar que el campo `color` del payload coincida con `^#[0-9A-Fa-F]{3,8}$`; si no cumple, SHALL re-emitirlo como cadena vacía para que el cliente aplique su fallback.

#### Scenario: Color válido
- **WHEN** el payload incluye `"color": "#a1b2c3"`
- **THEN** el color emitido es `#a1b2c3`

#### Scenario: Color inválido se descarta
- **WHEN** el payload incluye `"color": "#123; background:red"`
- **THEN** el color emitido es la cadena vacía

### Requirement: Payload JSON inválido se descarta
El servidor SHALL descartar el mensaje cuando el payload recibido no sea JSON válido o el campo `mensaje` no sea string, y SHALL emitir en su lugar un mensaje vacío que el cliente no visualiza.

#### Scenario: Payload no JSON
- **WHEN** el servidor recibe `not-json {`
- **THEN** se emite `{ "mensaje": "" }` y no se re-emitte el texto crudo
