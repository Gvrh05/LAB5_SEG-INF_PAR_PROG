# Tasks

## 1. Corrección de validaciones en `libs/unalib.js`

- [x] 1.1 Corregir `is_valid_url_image` para que pruebe el parámetro `url` (`re.test(url)` en vez de `re.test(phone)`) — verificado con `npm test` (`is_valid_url_image` verde)
- [x] 1.2 Corregir `is_valid_yt_video` para que pruebe el parámetro `url` (`re.test(url)`) y actualizar el regex para `youtube.com`/`youtu.be` (`watch?v=`, `/embed/`, `/v/`, con o sin `https://www.`) — verificado con `npm test` (`is_valid_yt_video` verde)

## 2. Seguridad del renderizado

- [x] 2.1 Agregar sanitización en `getImageTag`: eliminar `<`, `>`, `"`, `'` de la URL antes de construir el `<img>` — verificar con línea de código en `node -e` que la salida del tag no contiene `<script>`

## 3. Verificación de validación y transformación integrada

- [x] 3.1 Ejecutar la suite completa `npm test` y confirmar 5/5 casos aprobados
- [x] 3.2 Verificar `validateMessage` manualmente con `node -e`: mensaje texto → llega sin transformación; URL imagen → llega como `<img>`; URL de YouTube → llega como `<iframe src=".../embed/<id>"...>`

## 4. Verificación end-to-end del chat

- [x] 4.1 Iniciar `node server.js`, abrir dos clientes en `http://localhost:3000` y comprobar: (a) la URL de una imagen se muestra como imagen, (b) el link de YouTube se muestra como el reproductor embedded, (c) un texto normal se muestra como texto
